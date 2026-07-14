var Logger = {
    trace: [],
    timers: {},
    progressWindow: null,
    progressText: null,
    
    showProgress: function(title) {
        if (this.progressWindow) return;
        this.progressWindow = new Window("palette", title || "Processing...");
        this.progressWindow.orientation = "column";
        this.progressWindow.alignChildren = ["fill", "center"];
        this.progressWindow.spacing = 15;
        this.progressWindow.margins = 20;
        
        this.progressText = this.progressWindow.add("statictext", undefined, "Initializing...");
        this.progressText.preferredSize.width = 300;

        this.progressWindow.show();
        this.progressWindow.update();
    },
    
    updateProgress: function(msg) {
        if (this.progressWindow && this.progressText) {
            this.progressText.text = msg;
            this.progressWindow.update();
        }
    },
    
    closeProgress: function() {
        if (this.progressWindow) {
            this.progressWindow.close();
            this.progressWindow = null;
            this.progressText = null;
        }
    },

    info: function(msg) { this.trace.push("[INFO] " + new Date().toTimeString().split(' ')[0] + " - " + msg); },
    warn: function(msg) { this.trace.push("[WARN] " + new Date().toTimeString().split(' ')[0] + " - " + msg); },
    startTimer: function(label) { 
        this.timers[label] = new Date().getTime(); 
        this.info("STARTED: " + label); 
        this.updateProgress(label + "...");
    },
    endTimer: function(label, detail) { 
        var ms = new Date().getTime() - this.timers[label]; 
        var ext = detail ? " (" + detail + ")" : "";
        this.info("COMPLETED: " + label + " in " + ms + "ms" + ext); 
    },
    dump: function(errorObj, isSuccess) {
        var logFile = null;
        try {
            // Save to the hidden .system folder, keeping a continual log
            var scriptFolder = new File($.fileName).parent.parent.fsName;
            logFile = new File(scriptFolder + "/BrandSystem_ContinualLog.txt");
            
            if (logFile.exists && logFile.length > 5 * 1024 * 1024) { // 5MB cap
                var backupLog = new File(scriptFolder + "/BrandSystem_ContinualLog_old.txt");
                if (backupLog.exists) try { backupLog.remove(); } catch (e) {}
                try { logFile.copy(backupLog); } catch (e) {}
                logFile.open("w"); // Overwrite mode to reset the log
            } else {
                logFile.open("a"); // Append mode
            }
            
            logFile.writeln("\n\n========================================");
            logFile.writeln("=== BRAND SYSTEM EXECUTION LOG ===");
            logFile.writeln("Status: " + (isSuccess ? "SUCCESS" : "CRASH"));
            logFile.writeln("Timestamp: " + new Date().toString());
            logFile.writeln("InDesign Version: " + app.version);
            logFile.writeln("OS: " + $.os);
            
            if (errorObj) {
                logFile.writeln("\n=== FATAL EXCEPTION ===");
                logFile.writeln("Error: " + errorObj.message);
                logFile.writeln("Line: " + errorObj.line);
            }
            
            logFile.writeln("\n=== EXECUTION TRACE ===");
            for (var i = 0; i < this.trace.length; i++) {
                logFile.writeln(this.trace[i]);
            }
            logFile.writeln("========================================");
            return logFile.fsName;
        } catch (e) {
            return "Failed to write log file.";
        } finally {
            if (logFile) {
                try { logFile.close(); } catch (e) {}
            }
        }
    }
};