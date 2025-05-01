<?php
/**
 * Simple webhook debugging tool
 * 
 * Save this file as debug.php in the same directory as your webhook receiver
 * Access it via browser to see debug information and recent webhook logs
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start HTML output
echo '<!DOCTYPE html>
<html>
<head>
    <title>Webhook Debug Tool</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2 { color: #333; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; }
        .success { color: green; }
        .error { color: red; }
        .button { 
            display: inline-block; 
            padding: 8px 16px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <h1>Webhook Debug Tool</h1>';

// Function to check log file
function checkLogFile($filename) {
    echo '<h2>Checking Log File: ' . htmlspecialchars($filename) . '</h2>';
    
    if (file_exists($filename)) {
        echo '<p class="success">✅ Log file exists</p>';
        
        // Check if file is readable
        if (is_readable($filename)) {
            echo '<p class="success">✅ Log file is readable</p>';
            
            // Get last modification time
            $modTime = filemtime($filename);
            echo '<p>Last modified: ' . date('Y-m-d H:i:s', $modTime) . '</p>';
            
            // Get file size
            $size = filesize($filename);
            echo '<p>File size: ' . round($size / 1024, 2) . ' KB</p>';
            
            // Show last 10 lines of log
            echo '<h3>Recent Log Entries:</h3>';
            
            // Get last 20 lines (reverse order)
            $lines = file($filename);
            $lastLines = array_slice($lines, -20);
            
            echo '<pre>';
            foreach ($lastLines as $line) {
                echo htmlspecialchars($line);
            }
            echo '</pre>';
        } else {
            echo '<p class="error">❌ Log file is not readable</p>';
        }
    } else {
        echo '<p class="error">❌ Log file does not exist</p>';
        echo '<p>Try submitting a webhook to create the log file.</p>';
    }
}

// Check for the standard log file
checkLogFile(__DIR__ . '/webhook-debug.log');

// Also check for any alternate log file
$altLogFile = __DIR__ . '/../logs/webhook.log';
if (file_exists($altLogFile)) {
    checkLogFile($altLogFile);
}

// Database Check
echo '<h2>Testing Database Connection</h2>';

// Database connection settings - CHANGE THESE TO YOUR ACTUAL SETTINGS
$dbSettings = [
    'host' => 'localhost',
    'dbname' => 'testlink_glassshop',  // Your database name
    'user' => 'root',                  // Your database username
    'pass' => ''                       // Your database password
];

try {
    $dsn = "mysql:host={$dbSettings['host']};dbname={$dbSettings['dbname']};charset=utf8mb4";
    $pdo = new PDO($dsn, $dbSettings['user'], $dbSettings['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    echo '<p class="success">✅ Database connection successful!</p>';
    
    // Check if the webhook table exists
    $stmt = $pdo->prepare("SHOW TABLES LIKE 'formatic_submissions'");
    $stmt->execute();
    $tableExists = $stmt->fetchColumn();
    
    if ($tableExists) {
        echo '<p class="success">✅ Table \'formatic_submissions\' exists</p>';
        
        // Count records
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM formatic_submissions");
        $stmt->execute();
        $count = $stmt->fetchColumn();
        
        echo "<p>Total records: {$count}</p>";
        
        if ($count > 0) {
            // Show latest records
            $stmt = $pdo->prepare("SELECT * FROM formatic_submissions ORDER BY submitted_at DESC LIMIT 3");
            $stmt->execute();
            $records = $stmt->fetchAll();
            
            echo '<h3>Latest Records:</h3>';
            echo '<pre>';
            foreach ($records as $record) {
                echo "ID: {$record['id']}, Form: {$record['form_name']}, Submitted: {$record['submitted_at']}\n";
                echo "Data: " . substr($record['submission_data'], 0, 100) . "...\n\n";
            }
            echo '</pre>';
        }
    } else {
        echo '<p class="error">❌ Table \'formatic_submissions\' does not exist</p>';
    }
} catch (PDOException $e) {
    echo '<p class="error">❌ Database connection failed: ' . htmlspecialchars($e->getMessage()) . '</p>';
}

// Check PHP configuration
echo '<h2>PHP Environment</h2>';
echo '<pre>';
echo 'PHP Version: ' . phpversion() . "\n";
echo 'Display Errors: ' . ini_get('display_errors') . "\n";
echo 'Error Reporting: ' . ini_get('error_reporting') . "\n";
echo 'Log Errors: ' . ini_get('log_errors') . "\n";
echo 'Error Log: ' . ini_get('error_log') . "\n";
echo '</pre>';

// Show manual webhook submission tool
echo '<h2>Manual Webhook Test</h2>';
echo '<p>Use this form to manually send a test webhook to your endpoint:</p>';

echo '<form method="post" action="./webhook-receiver.php">
    <textarea name="webhookData" style="width: 100%; height: 200px;">
{
  "event": "SUBMISSION_CREATED",
  "form": {
    "id": "65fef360-29a5-40ed-a79e-78fccdc4842c",
    "title": "Contact Form"
  },
  "submission": {
    "id": "sub_manual_test_' . time() . '",
    "createdAt": "' . date('c') . '",
    "data": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "123-456-7890",
      "message": "This is a manual test message"
    }
  },
  "timestamp": "' . date('c') . '"
}
    </textarea>
    <br>
    <input type="submit" value="Send Manual Test" class="button">
</form>';

// End HTML output
echo '</body></html>';
?> 