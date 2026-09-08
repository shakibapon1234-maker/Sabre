package com.sabre.training;

import android.content.Intent;
import android.os.Bundle;
import android.text.InputFilter;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

/**
 * First screen the user sees. Checks any existing license; if it's already
 * ACTIVE, skips straight to MainActivity. Otherwise shows the appropriate
 * message for NOT_ACTIVATED / EXPIRED / WRONG_DEVICE / TAMPERED /
 * INVALID_KEY and lets the user enter (or re-enter) a key.
 */
public class LicenseActivity extends AppCompatActivity {

    private LicenseManager licenseManager;
    private EditText keyInput;
    private TextView statusText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_license);

        licenseManager = new LicenseManager(this);
        keyInput = findViewById(R.id.licenseKeyInput);
        statusText = findViewById(R.id.licenseStatusText);
        Button activateButton = findViewById(R.id.activateButton);

        // Auto-format as SBR-XXXX-XXXX-XXXX while typing is handled in XML
        // via a simple uppercase input filter; length capped to the key format.
        keyInput.setFilters(new InputFilter[]{new InputFilter.AllCaps(), new InputFilter.LengthFilter(19)});

        activateButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                attemptActivation();
            }
        });

        checkExistingLicense();
    }

    private void checkExistingLicense() {
        LicenseManager.Result result = licenseManager.checkLicense();
        switch (result.state) {
            case ACTIVE:
                goToMain();
                return;
            case NOT_ACTIVATED:
                statusText.setText(R.string.license_status_not_activated);
                break;
            case EXPIRED:
                statusText.setText(R.string.license_status_expired);
                break;
            case WRONG_DEVICE:
                statusText.setText(R.string.license_status_wrong_device);
                break;
            case TAMPERED:
                statusText.setText(R.string.license_status_tampered);
                break;
            case INVALID_KEY:
                statusText.setText(R.string.license_status_invalid);
                break;
        }
    }

    private void attemptActivation() {
        String rawKey = keyInput.getText().toString();
        if (!licenseManager.isKeyFormatValid(rawKey)) {
            statusText.setText(R.string.license_status_invalid);
            Toast.makeText(this, R.string.license_toast_invalid, Toast.LENGTH_SHORT).show();
            return;
        }

        LicenseManager.Result result = licenseManager.activate(rawKey);
        if (result.state == LicenseManager.State.ACTIVE) {
            Toast.makeText(this, R.string.license_toast_activated, Toast.LENGTH_SHORT).show();
            goToMain();
        } else {
            statusText.setText(R.string.license_status_invalid);
        }
    }

    private void goToMain() {
        startActivity(new Intent(this, MainActivity.class));
        finish();
    }
}
