package com.example.ownskill

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import com.example.ownskill.theme.OwnSkillTheme

class MainActivity : ComponentActivity() {

    private var vibrator: Vibrator? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator

        setContent {
            OwnSkillTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = androidx.compose.material3.MaterialTheme.colorScheme.background
                ) {
                    WebViewContainer()
                }
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @androidx.compose.runtime.Composable
    fun WebViewContainer() {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { context ->
                WebView(context).apply {
                    // Enable full hardware acceleration
                    setLayerType(WebView.LAYER_TYPE_HARDWARE, null)

                    // Basic Settings
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    settings.databaseEnabled = true
                    settings.allowFileAccess = true
                    settings.allowContentAccess = true
                    settings.useWideViewPort = true
                    settings.loadWithOverviewMode = true
                    settings.supportZoom()

                    // Enable relative file access for compiled React ES Module assets (*.js, *.css)
                    @Suppress("DEPRECATION")
                    settings.allowFileAccessFromFileURLs = true
                    @Suppress("DEPRECATION")
                    settings.allowUniversalAccessFromFileURLs = true

                    // Enable mixed content loading for assets/APIs loaded from secure/unsecure remote servers
                    settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

                    // Disable scrollbars to prevent gray scroll bars showing on WebView screen
                    isVerticalScrollBarEnabled = false
                    isHorizontalScrollBarEnabled = false

                    // Handle internal and external links with complete support for modern SDK devices
                    webViewClient = object : WebViewClient() {
                        @Deprecated("Deprecated in Java")
                        override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                            return false // Keep navigation inside local WebView SPA
                        }

                        override fun shouldOverrideUrlLoading(
                            view: WebView,
                            request: android.webkit.WebResourceRequest
                        ): Boolean {
                            return false // Keep navigation inside local WebView SPA
                        }
                    }

                    webChromeClient = WebChromeClient()

                    // Register Native JavaScript Bridge
                    addJavascriptInterface(OwnSkillJSInterface(context), "OwnSkillAndroid")

                    // Load index.html from local assets
                    loadUrl("file:///android_asset/www/index.html")
                }
            }
        )
    }

    inner class OwnSkillJSInterface(private val context: Context) {

        @JavascriptInterface
        fun showToast(message: String) {
            runOnUiThread {
                Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
            }
        }

        @JavascriptInterface
        fun vibrate(durationMs: Long) {
            runOnUiThread {
                vibrator?.let {
                    if (it.hasVibrator()) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            it.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
                        } else {
                            @Suppress("DEPRECATION")
                            it.vibrate(durationMs)
                        }
                    }
                }
            }
        }

        @JavascriptInterface
        fun updateThemeColor(statusBarHex: String, navBarHex: String) {
            runOnUiThread {
                try {
                    val window = this@MainActivity.window
                    val sColor = Color.parseColor(statusBarHex)
                    val nColor = Color.parseColor(navBarHex)

                    window.statusBarColor = sColor
                    window.navigationBarColor = nColor

                    // Set light/dark styling for bars depending on color brightness
                    val decorView = window.decorView
                    val controller = WindowCompat.getInsetsController(window, decorView)
                    
                    val isLightStatus = isColorLight(sColor)
                    val isLightNav = isColorLight(nColor)
                    
                    controller.isAppearanceLightStatusBars = isLightStatus
                    controller.isAppearanceLightNavigationBars = isLightNav
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }

        @JavascriptInterface
        fun openUrl(url: String) {
            runOnUiThread {
                try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }

        @JavascriptInterface
        fun exitApp() {
            runOnUiThread {
                finish()
            }
        }

        private fun isColorLight(color: Int): Boolean {
            val darkness = 1 - (0.299 * Color.red(color) + 0.587 * Color.green(color) + 0.114 * Color.blue(color)) / 255
            return darkness < 0.5
        }
    }
}

