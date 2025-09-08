package com.f_y_p   // use your actual package name

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class BlockedActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_blocked)

        val pkg = intent.getStringExtra("APP_NAME")
        findViewById<TextView>(R.id.blockedText).text =
            "The app $pkg is blocked!"
    }
}
