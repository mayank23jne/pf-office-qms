<?php
/**
 * One-time setup runner for cPanel
 * Upload this file to your cPanel root and visit it in your browser
 * Example: https://pfapi.jyada.in/run-setup.php
 * 
 * ⚠️ DELETE THIS FILE AFTER RUNNING!
 */

// Security: Set a secret key to prevent unauthorized access
$SECRET_KEY = 'pf-qms-setup-2026'; // CHANGE THIS!

if (!isset($_GET['key']) || $_GET['key'] !== $SECRET_KEY) {
    die('❌ Unauthorized. Set ?key=your-secret-key-here');
}

echo "<h1>PF-QMS Backend Setup</h1>";
echo "<pre>";

// Get the directory where this PHP file is located
$appDir = __DIR__;
chdir($appDir);

echo "📂 Working directory: " . getcwd() . "\n\n";

// Run setup.js
echo "🔧 Running setup.js...\n";
echo "=" . str_repeat("=", 60) . "\n";

$output = shell_exec('node setup.js 2>&1');
echo $output;

echo "\n" . str_repeat("=", 60) . "\n";
echo "✅ Setup script completed!\n";
echo "\n⚠️ IMPORTANT: DELETE THIS FILE (run-setup.php) NOW FOR SECURITY!\n";
echo "\nThen restart your Node.js app in cPanel.";

echo "</pre>";
?>
