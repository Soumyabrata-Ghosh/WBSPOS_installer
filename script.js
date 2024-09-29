// Load Google API client
function loadClient() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        apiKey: 'AIzaSyBTa4PPAQNBEMuMX51-MoJ92gJk9JO1gz4',  // Replace with your API key
        clientId: '540030881274-5tsuuk9vpa1vdvodatgl2c1qviqsk6h4.apps.googleusercontent.com',  // Replace with your Client ID
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: 'https://www.googleapis.com/auth/drive.readonly'
    }).then(function () {
        gapi.auth2.getAuthInstance().signIn();
    });
}

document.getElementById('downloadButton').addEventListener('click', function () {
    const folderId = '1DxfbdznZtrs9JqsY95PAtSM6m5PhgllE';  // Replace with actual Google Drive folder ID
    downloadGoogleDriveFolder(folderId);
});

async function downloadGoogleDriveFolder(folderId) {
    // Fetch the list of files in the Google Drive folder
    let response = await gapi.client.drive.files.list({
        q: `'${folderId}' in parents`,
        fields: 'files(id, name, md5Checksum)',
        pageSize: 1000
    });

    let files = response.result.files;

    if (!files || files.length === 0) {
        log('No files found in the folder.');
        return;
    }

    const directoryPicker = document.getElementById('directoryPicker').files;
    if (directoryPicker.length === 0) {
        log('No directory selected.');
        return;
    }

    const localFolder = directoryPicker[0].webkitRelativePath.split('/')[0];

    // Loop through files and download each
    for (let file of files) {
        const fileResponse = await gapi.client.drive.files.get({
            fileId: file.id,
            alt: 'media'
        }, { responseType: 'blob' });

        // Save to selected local folder
        const blob = fileResponse.body;
        saveFile(blob, file.name, localFolder);

        // Verify file integrity by comparing MD5
        const localMD5 = await calculateMD5(blob);
        if (localMD5 !== file.md5Checksum) {
            log(`File integrity check failed for ${file.name}.`);
        } else {
            log(`File ${file.name} downloaded and verified.`);
        }
    }
}

// Save file to selected directory
function saveFile(blob, fileName, folder) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${folder}/${fileName}`;
    a.click();
    URL.revokeObjectURL(a.href);
}

// Calculate MD5 checksum
function calculateMD5(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            const buffer = event.target.result;
            const hashBuffer = crypto.subtle.digest('MD5', buffer);
            hashBuffer.then(hash => {
                const hashArray = Array.from(new Uint8Array(hash));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                resolve(hashHex);
            }).catch(reject);
        };
        reader.readAsArrayBuffer(blob);
    });
}

// Log messages
function log(message) {
    const logElement = document.getElementById('log');
    logElement.textContent += message + '\n';
}

document.addEventListener('DOMContentLoaded', loadClient);
