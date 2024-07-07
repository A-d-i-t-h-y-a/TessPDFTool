const select = document.getElementById("subject");
const units = document.getElementById("units");
const navTab = document.getElementById("nav-tab");
const tabContent = document.getElementById("nav-tabContent");

async function sendAuth() {
    let auth = sessionStorage.getItem("auth");
    console.log(auth);
    if(auth == null){
        auth = document.getElementById("AUTH").value;
        console.log(JSON.stringify({auth}))
    }
    await fetch("/sendAuth", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({auth})
    })
    let valid = await abcd();
    if(valid == true){
        sessionStorage.setItem("auth", auth);
        document.getElementById("Auth").style.display = "none";
    }
    else{
        alert("Invalid Token");
        if(sessionStorage.getItem("auth") != null) sessionStorage.removeItem('auth')
        document.getElementById("Auth").style.display = "block";
    }
}

async function getUnits() {
    const subjectId = select.value;
    if (!subjectId || subjectId === "sub") {
        alert("Please select a subject.");
        return;
    }

    try {
        const response = await fetch(`/getUnits/${subjectId}`);
        const data = await response.json();
        document.getElementById("main").style.display = "block";
        navTab.innerHTML = "";
        tabContent.innerHTML = "";
        displayUnits(data.units);
    } catch (error) {
        console.error("Error fetching units:", error);
    }
}

async function displayUnits(unitNames) {
    let i = 0;
    let w = 100 / Object.keys(unitNames).length;
    // console.log(unitNames);
    for (const unitName in unitNames) {
        const unitHeading = document.createElement('button');
        unitHeading.className = (i == 0) ? 'nav-link active' : 'nav-link';
        unitHeading.id = `nav-${unitName}-tab`;
        unitHeading.setAttribute('data-bs-toggle', 'tab');
        unitHeading.setAttribute('data-bs-target', `#${unitName}`);
        unitHeading.type = 'button';
        unitHeading.role = 'tab';
        unitHeading.style.width = `${w}%`
        unitHeading.setAttribute('aria-controls', `nav-${unitName}`);
        unitHeading.setAttribute('aria-selected', (i == 0) ? 'true' : 'false');

        unitHeading.textContent = unitName;

        navTab.appendChild(unitHeading);
        const tabPane = document.createElement('div');
        tabPane.className = `tab-pane fade ${(i++ == 0) ? "show active" : ""}`;
        tabPane.id = `${unitName}`;
        tabPane.role = 'tabpanel';
        tabPane.setAttribute('aria-labelledby', `nav-${unitName}-tab`);
        tabPane.tabIndex = 0;
        tabPane.style.paddingTop = "1.5rem"
        tabContent.appendChild(tabPane);
        const downloadButton = document.createElement("button");
        downloadButton.textContent = "Download Topics";
        const buttonId = `downloadbtn_${unitNames[unitName]}`;
        downloadButton.id = buttonId;
        downloadButton.onclick = (event) => {
            getUnitTopics(unitNames[unitName], unitName, event.target);
        };
        const res = await displayTopics(unitNames[unitName], tabPane);
        if(res) tabPane.appendChild(downloadButton);
    }
}


async function getUnitTopics(unitId, unitName, target) {
    try {
        const response = await fetch(`/getTopics/${unitId}`);
        const data = await response.json();
        const unitTopics = data.topics;
        downloadTopics(unitId, unitName, unitTopics, target);
    } catch (error) {
        console.error("Error fetching topics:", error);
    }
}

async function downloadTopics(unitId, unitName, unitTopics, dbtn) {
    try {
        console.log(dbtn)
        const directoryHandle = await window.showDirectoryPicker();

        let cnt = 1;

        let total = unitTopics.length;
        for (const t of unitTopics) if (t.pdf == null) total--;

        dbtn.style.setProperty("--btnclr", "rgba(0, 128, 0, 0.4)");
        for (const topic of unitTopics) {
            const pdfFileName = topic.pdf;
            if (pdfFileName == null) continue;

            const temp = `https://api.tesseractonline.com/${pdfFileName}`;

            const pdfUrl = `/proxy-pdf/${encodeURIComponent(temp)}`;

            const topicFolder = await directoryHandle.getDirectoryHandle(unitName, { create: true });
            const sanitizedFilename = sanitizeFilename(topic.name);
            const fileHandle = await topicFolder.getFileHandle(cnt + "." + sanitizedFilename + ".pdf", { create: true });

            const writable = await fileHandle.createWritable();
            const response = await fetch(pdfUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch PDF: ${response.statusText}`);
            }
            const pdfBlob = await response.blob();
            await writable.write(pdfBlob);
            await writable.close();
            dbtn.style.setProperty("--afterbtn", ((cnt++ / total) * 100) + "%");
        }
        setTimeout(() => {
            dbtn.style.setProperty("--afterbtn", "0%");
        }, 300);
        console.log("All topics downloaded successfully");
    } catch (error) {
        dbtn.style.setProperty("--btnclr", "rgba(255, 0, 0, 0.4)");
        console.error("Error downloading topics:", error);
    }
}





async function displayTopics(unitId, tabPane) {
    try {
        const response = await fetch(`/getTopics/${unitId}`);
        const data = await response.json();
        const unitTopics = data.topics;
        const countPDFs = unitTopics.filter(topic => topic.pdf != null).length;
        if (countPDFs === 0) {
            const noTopicsMessage = document.createElement("p");
            noTopicsMessage.style.color = 'grey';
            noTopicsMessage.style.textAlign = 'center';
            noTopicsMessage.style.marginBottom = '1.5rem';
            noTopicsMessage.textContent = "No topics found for this unit";
            tabPane.appendChild(noTopicsMessage);
            return false;
        }

        let ol = document.createElement("ol");
        let cnt = 1;

        unitTopics.forEach(topic => {
            if (topic.pdf != null) {
                let li = document.createElement("li");
                li.style.padding = "0.3rem 0";
                const anchor = document.createElement("a");
                anchor.textContent = topic.name;
                anchor.href = 'https://api.tesseractonline.com/' + topic.pdf; // Assuming "pdf" is the key containing the PDF URL
                anchor.download = cnt + topic.name + ".pdf"; // Set the download attribute to specify the filename
                anchor.target = "__blank"
                anchor.style.display = "block"; // Display each anchor on a new line
                li.appendChild(anchor);
                ol.appendChild(li);
            }
            cnt++;
        });
        tabPane.appendChild(ol);
        return true;
    } catch (error) {
        console.error("Error fetching topics:", error);
        return false;
    }
}


function sanitizeFilename(filename) {
    // Replace disallowed characters, including control characters, with underscores
    return filename.replace(/[<>:"\/\\|?*\x00-\x1F]/g, "_");
}


async function abcd() {
    try {
        const response = await fetch("/getSub");
        const data = await response.json();
        data.sub.forEach(subject => {
            const option = document.createElement("option");
            option.value = subject;
            option.textContent = subject;
            select.appendChild(option);
        });
        return true;
    } catch (error) {
        console.error("Error fetching subjects:", error);
    }
}

var convertBtn = document.getElementById("convert-yt");
convertBtn.addEventListener('click', () => {
    console.log("Hello")
    sendURL("https://youtu.be/F0Koz414TYg");
});

function sendURL(URL) {
    console.log("In Func")
    window.location.href = `/download?URL=${URL}?topicName=Arduino`;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("main").style.display = "none";
    if(sessionStorage.getItem("auth")!=null){
        document.getElementById('Auth').style.display = "none";
        sendAuth();
    }
});
