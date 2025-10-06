package com.f_y_p

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class BlockedActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_blocked)

        val appName = intent.getStringExtra("APP_NAME")
        val websiteUrl = intent.getStringExtra("WEBSITE_URL")

        val message = when {
            appName != null -> "🚫 The app $appName is blocked!"
            websiteUrl != null -> "🚫 The website $websiteUrl is blocked!"
            else -> "🚫 This content is blocked!"
        }

        findViewById<TextView>(R.id.blockedText).text = message
    }
}
