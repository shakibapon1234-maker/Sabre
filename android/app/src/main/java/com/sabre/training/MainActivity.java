package com.sabre.training;

import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.appcompat.app.AppCompatActivity;

/**
 * Hosts the training simulator itself (index.html + js/) in a WebView.
 * Re-checks the license every time this activity resumes — a key that
 * expires or gets tampered with mid-session bounces the user back to
 * LicenseActivity on the next resume rather than only at cold start.
 */
public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private LicenseManager licenseManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Block screenshots and screen recording of the training session.
        getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE);

        setContentView(R.layout.activity_main);

        licenseManager = new LicenseManager(this);

        webView = findViewById(R.id.webView);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);

        webView.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    protected void onResume() {
        super.onResume();
        LicenseManager.Result result = licenseManager.checkLicense();
        if (result.state != LicenseManager.State.ACTIVE) {
            finish(); // fall back to LicenseActivity, which will show the specific reason
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
