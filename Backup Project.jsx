#target "indesign"

(function() {
    var baseDir = new File($.fileName).parent;
    var date = new Date();
    var ts = date.getFullYear().toString() + 
             ("0" + (date.getMonth() + 1)).slice(-2) + 
             ("0" + date.getDate()).slice(-2) + "_" + 
             ("0" + date.getHours()).slice(-2) + 
             ("0" + date.getMinutes()).slice(-2) + 
             ("0" + date.getSeconds()).slice(-2);
             
    var backupDir = new Folder(baseDir.fsName + "/BrandSystem_Backup_" + ts);
    if (!backupDir.exists) backupDir.create();
    
    function copyRecursive(srcFolder, destFolder) {
        if (!destFolder.exists) destFolder.create();
        var items = srcFolder.getFiles();
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item instanceof Folder) {
                copyRecursive(item, new Folder(destFolder.fsName + "/" + item.name));
            } else {
                item.copy(new File(destFolder.fsName + "/" + item.name));
            }
        }
    }

    var itemsToBackup = [
        { name: "Apply Brand System.jsx", isFolder: false },
        { name: "Update Brand Templates.jsx", isFolder: false },
        { name: "Batch Generate Base Templates.jsx", isFolder: false },
        { name: "Extract Config Information.jsx", isFolder: false },
        { name: "Uninstall Brand System.jsx", isFolder: false },
        { name: "Export Custom Document.jsx", isFolder: false },
        { name: "Backup Project.jsx", isFolder: false },
        { name: "README.md", isFolder: false },
        { name: "CHANGELOG.md", isFolder: false },
        { name: ".system", isFolder: true }
    ];
    
    for (var j = 0; j < itemsToBackup.length; j++) {
        var targetName = itemsToBackup[j].name;
        var srcPath = baseDir.fsName + "/" + targetName;
        var destPath = backupDir.fsName + "/" + targetName;
        
        if (itemsToBackup[j].isFolder) {
            var srcFolder = new Folder(srcPath);
            if (srcFolder.exists) copyRecursive(srcFolder, new Folder(destPath));
        } else {
            var srcFile = new File(srcPath);
            if (srcFile.exists) srcFile.copy(new File(destPath));
        }
    }
    
    // Backup User Preferences (UI Dialog States)
    var prefsFile = new File(Folder.userData + "/BrandSystem_Prefs.jsx");
    if (prefsFile.exists) {
        prefsFile.copy(new File(backupDir.fsName + "/BrandSystem_Prefs.jsx"));
    }
    
    alert("Backup Successful!\n\nYour complete project has been safely backed up to:\n" + backupDir.fsName + "\n\nYou can move this folder to an external drive or ZIP it for archiving.");
})();