/*
package com.f_y_p

import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import org.minidns.dnsmessage.DnsMessage
import org.minidns.record.A
import org.minidns.dnsname.DnsName
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.*
import java.util.concurrent.Executors
import android.util.Log
import java.lang.Exception

class WebsiteBlockerVpnService : VpnService(), Runnable {

    companion object {
        private const val TAG = "WebsiteBlockerVpn"
    }

    private var vpnInterface: ParcelFileDescriptor? = null
    private var running = true
    private val executor = Executors.newSingleThreadExecutor()
    private val upstreamDns = InetSocketAddress("1.1.1.1", 53) // Cloudflare

    override fun onCreate() {
        super.onCreate()
        executor.execute(this)
        Log.i(TAG, "Service created")
    }

    override fun onDestroy() {
        running = false
        try { vpnInterface?.close() } catch (_: Exception) {}
        executor.shutdownNow()
        Log.i(TAG, "Service destroyed")
        super.onDestroy()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun run() {
        try {
            val builder = Builder()
                .setSession("WebsiteBlockerVPN")
                .addAddress("10.0.0.2", 32)
                .addRoute("0.0.0.0", 0) // Route ALL traffic through VPN
                .addDnsServer("10.0.0.2")
                .allowBypass()

            // Protect the socket that we'll use to forward DNS queries
            protect(DatagramSocket().apply { close() })

            vpnInterface = builder.establish()
            if (vpnInterface == null) {
                Log.e(TAG, "Failed to establish VPN")
                return
            }

            Log.i(TAG, "VPN established")
            val fd = vpnInterface?.fileDescriptor ?: return
            val input = FileInputStream(fd)
            val output = FileOutputStream(fd)
            val buffer = ByteArray(32767)

            while (running) {
                val len = try { 
                    input.read(buffer) 
                } catch (e: Exception) {
                    Log.e(TAG, "Read error: ${e.message}")
                    break
                }
                if (len <= 0) continue

                var packetToForward: ByteArray? = null
                var shouldForwardAsIs = true

                try {
                    val pkt = buffer.copyOf(len)
                    packetToForward = pkt // Keep reference for error handling

                    val version = (pkt[0].toInt() ushr 4) and 0x0F
                    if (version != 4) {
                        shouldForwardAsIs = true
                        continue
                    }

                    val ihl = (pkt[0].toInt() and 0x0F) * 4
                    if (ihl < 20 || ihl > pkt.size) {
                        shouldForwardAsIs = true
                        continue
                    }

                    val protocol = pkt[9].toInt() and 0xFF
                    if (protocol != 17) { // Not UDP
                        shouldForwardAsIs = true
                        continue
                    }

                    val udpOffset = ihl
                    if (udpOffset + 8 > pkt.size) {
                        shouldForwardAsIs = true
                        continue
                    }

                    val dstPort = ((pkt[udpOffset + 2].toInt() and 0xFF) shl 8) or (pkt[udpOffset + 3].toInt() and 0xFF)
                    
                    if (dstPort != 53) { // Not DNS
                        shouldForwardAsIs = true
                        continue
                    }

                    // Process DNS query
                    val dnsPayloadOffset = udpOffset + 8
                    if (dnsPayloadOffset >= pkt.size) {
                        shouldForwardAsIs = true
                        continue
                    }
                    
                    val dnsData = pkt.copyOfRange(dnsPayloadOffset, pkt.size)

                    val dnsResponsePayload = handleDnsRequest(dnsData)
                    
                    if (dnsResponsePayload != null) {
                        // Wrap back into IP/UDP
                        val srcIp = pkt.copyOfRange(12, 16)
                        val dstIp = pkt.copyOfRange(16, 20)
                        val srcPort = ((pkt[udpOffset].toInt() and 0xFF) shl 8) or (pkt[udpOffset + 1].toInt() and 0xFF)
                        val respPacket = buildIpv4UdpResponse(
                            origIpPacket = pkt,
                            origIhl = ihl,
                            origSrcIp = srcIp,
                            origDstIp = dstIp,
                            origSrcPort = srcPort,
                            origDstPort = dstPort,
                            dnsResponse = dnsResponsePayload
                        )

                        packetToForward = respPacket
                        shouldForwardAsIs = false
                        Log.d(TAG, "DNS reply sent (len=${respPacket.size})")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Packet handling error: ${e.message}")
                    // Forward original packet if error occurs
                    shouldForwardAsIs = true
                }

                // Forward the packet
                try {
                    if (packetToForward != null) {
                        output.write(packetToForward)
                        output.flush()
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to forward packet: ${e.message}")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Service run failed: ${e.message}", e)
        } finally {
            try { vpnInterface?.close() } catch (_: Exception) {}
            vpnInterface = null
            Log.i(TAG, "VPN service stopped")
        }
    }

    // --- Block or forward logic ---
    private fun handleDnsRequest(packet: ByteArray): ByteArray? {
        try {
            val request = DnsMessage(packet)
            val question = request.questions.firstOrNull() ?: return forwardToUpstream(packet)
            val qName = question.name.toString().lowercase()

            return if (isBlocked(qName)) {
                Log.i(TAG, "Blocking domain: $qName")
                showBlockedScreen(qName)
                buildBlockedResponse(request)
            } else {
                forwardToUpstream(packet)
            }
        } catch (e: Exception) {
            Log.e(TAG, "DNS parsing error: ${e.message}")
            return forwardToUpstream(packet)
        }
    }

    private fun forwardToUpstream(packet: ByteArray): ByteArray? {
        return try {
            DatagramSocket().use { socket ->
                protect(socket) // Critical - prevents recursive routing
                socket.soTimeout = 3000
                socket.send(DatagramPacket(packet, packet.size, upstreamDns))
                val buf = ByteArray(4096)
                val resp = DatagramPacket(buf, buf.size)
                socket.receive(resp)
                buf.copyOf(resp.length)
            }
        } catch (e: Exception) {
            Log.w(TAG, "forwardToUpstream failed: ${e.message}")
            null
        }
    }

    private fun buildIpv4UdpResponse(
        origIpPacket: ByteArray,
        origIhl: Int,
        origSrcIp: ByteArray,
        origDstIp: ByteArray,
        origSrcPort: Int,
        origDstPort: Int,
        dnsResponse: ByteArray
    ): ByteArray {
        val ipHeaderLen = 20
        val udpHeaderLen = 8
        val totalLen = ipHeaderLen + udpHeaderLen + dnsResponse.size
        val pkt = ByteArray(totalLen)

        // IP header
        pkt[0] = 0x45.toByte() // Version 4, IHL 5 (20 bytes)
        pkt[1] = 0x00 // DSCP/ECN
        pkt[2] = ((totalLen shr 8) and 0xFF).toByte() // Total Length high byte
        pkt[3] = (totalLen and 0xFF).toByte() // Total Length low byte
        pkt[4] = origIpPacket[4] // ID high byte
        pkt[5] = origIpPacket[5] // ID low byte
        pkt[6] = 0; pkt[7] = 0 // Flags and Fragment offset
        pkt[8] = 64.toByte() // TTL
        pkt[9] = 17.toByte() // Protocol (UDP)
        pkt[10] = 0; pkt[11] = 0 // Checksum (filled later)
        
        // Swap source and destination for response
        System.arraycopy(origDstIp, 0, pkt, 12, 4) // Source IP
        System.arraycopy(origSrcIp, 0, pkt, 16, 4) // Destination IP

        // Calculate IP header checksum
        val ipChecksum = computeIpChecksum(pkt, 0, ipHeaderLen)
        pkt[10] = ((ipChecksum shr 8) and 0xFF).toByte()
        pkt[11] = (ipChecksum and 0xFF).toByte()

        // UDP header
        pkt[20] = ((origDstPort shr 8) and 0xFF).toByte() // Source port high byte
        pkt[21] = (origDstPort and 0xFF).toByte() // Source port low byte
        pkt[22] = ((origSrcPort shr 8) and 0xFF).toByte() // Destination port high byte
        pkt[23] = (origSrcPort and 0xFF).toByte() // Destination port low byte
        
        val udpLen = udpHeaderLen + dnsResponse.size
        pkt[24] = ((udpLen shr 8) and 0xFF).toByte() // UDP length high byte
        pkt[25] = (udpLen and 0xFF).toByte() // UDP length low byte
        pkt[26] = 0; pkt[27] = 0 // UDP checksum (optional for IPv4)
        
        // Copy DNS payload
        System.arraycopy(dnsResponse, 0, pkt, ipHeaderLen + udpHeaderLen, dnsResponse.size)
        
        // Calculate UDP checksum (optional but good practice)
        // UDP checksum is more complex and involves pseudo-header
        // For simplicity, we're keeping it 0 which is valid for IPv4
        
        return pkt
    }

    private fun computeIpChecksum(buf: ByteArray, offset: Int, len: Int): Int {
        var sum = 0
        var i = offset
        while (i < offset + len) {
            if (i == offset + 10) { i += 2; continue } // Skip checksum field
            val high = buf[i].toInt() and 0xFF
            val low = if (i + 1 < offset + len) buf[i + 1].toInt() and 0xFF else 0
            sum += (high shl 8) + low
            if (sum and 0xFFFF0000.toInt() != 0) {
                sum = (sum and 0xFFFF) + (sum ushr 16)
            }
            i += 2
        }
        while (sum ushr 16 != 0) {
            sum = (sum and 0xFFFF) + (sum ushr 16)
        }
        return sum.inv() and 0xFFFF
    }

    private fun isBlocked(domain: String): Boolean {
        if (domain.isBlank()) return false
        val prefs = getSharedPreferences("BlockerPrefs", 0)
        val blockedWebsites = prefs.getStringSet("blocked_websites", mutableSetOf()) ?: mutableSetOf()
        
        // More accurate domain matching
        return blockedWebsites.any { blockedDomain ->
            val normalizedBlockedDomain = blockedDomain.trim().lowercase()
            domain == normalizedBlockedDomain || 
            domain.endsWith(".$normalizedBlockedDomain")
        }
    }

    private fun buildBlockedResponse(request: DnsMessage): ByteArray {
        try {
            val question = request.questions.firstOrNull() ?: return request.toArray()
            val qName = question.name
            val blockedIp = InetAddress.getByName("127.0.0.1")
            
            val builder = DnsMessage.builder()
                .setId(request.id)
                .setQrFlag(true)  // This is a response
                .setAuthoritativeAnswer(true)
                .setResponseCode(DnsMessage.RESPONSE_CODE.NO_ERROR)
                .addQuestion(question)
            
            // Create A record pointing to localhost
            val record = org.minidns.record.Record<A>(
                qName,
                org.minidns.record.Record.TYPE.A,
                org.minidns.record.Record.CLASS.IN.value, // Use .value to get the integer class
                300.toLong(), // Convert TTL (300) to Long
                A(blockedIp as Inet4Address)
            )
            
            builder.addAnswer(record)
            return builder.build().toArray()
        } catch (e: Exception) {
            Log.e(TAG, "Error building blocked response: ${e.message}")
            return request.toArray() // Return original as fallback
        }
    }

    private var lastBlockedShownAt = 0L
    private fun showBlockedScreen(domain: String) {
        val now = System.currentTimeMillis()
        if (now - lastBlockedShownAt < 2000) return
        lastBlockedShownAt = now
        try {
            val intent = Intent(this, BlockedActivity::class.java)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            intent.putExtra("domain", domain)
            startActivity(intent)
        } catch (e: Exception) {
            Log.w(TAG, "showBlockedScreen failed: ${e.message}")
        }
    }
}
*/