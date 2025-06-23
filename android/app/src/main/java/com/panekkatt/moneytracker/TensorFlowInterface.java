package com.panekkatt.moneytracker;

import android.webkit.JavascriptInterface;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class TensorFlowInterface {
    private final BridgeActivity activity;
    private static final String TAG = "TensorFlowInterface";

    public TensorFlowInterface(BridgeActivity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void logError(String message) {
        Log.e(TAG, "TensorFlow Error: " + message);
    }

    @JavascriptInterface
    public boolean isTensorFlowSupported() {
        // Simple check to detect if device likely supports all TensorFlow features
        return android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N;
    }
} 