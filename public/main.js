const select = document.getElementById("subject");
const units = document.getElementById("units");
const topics = document.getElementById("topics");


async function getUnits() {
    const subjectId = select.value;
    if (!subjectId || subjectId === "sub") {
        alert("Please select a subject.");
        return;
    }

    try {
        const response = await fetch(`/getUnits/${subjectId}`);
        const data = await response.json();
        displayUnits(data.units);
    } catch (error) {
        console.error("Error fetching units:", error);
    }
}

async function displayUnits(unitNames) {
    for (const unitName in unitNames) {
        const unitHeading = document.createElement("h3");
        unitHeading.textContent = unitName;
        units.appendChild(unitHeading);

        const downloadButton = document.createElement("button");
        downloadButton.textContent = "Download Topics";
        const buttonId = `downloadbtn_${unitNames[unitName]}`;
        downloadButton.id = buttonId;
        downloadButton.onclick = (event) => {
            getUnitTopics(unitNames[unitName], unitName, event.target);
        };
        await displayTopics(unitNames[unitName]);
        units.appendChild(downloadButton);
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
        for(const t of unitTopics) if(t.pdf == null) total --;
        
        dbtn.style.setProperty("--btnclr", "rgba(0, 128, 0, 0.4)");
        for (const topic of unitTopics) {
            const pdfFileName = topic.pdf;
            if(pdfFileName == null) continue;

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





async function displayTopics(unitId) {
    try {
        const response = await fetch(`/getTopics/${unitId}`);
        const data = await response.json();
        const unitTopics = data.topics;

        if (unitTopics.length === 0) {
            const noTopicsMessage = document.createElement("p");
            noTopicsMessage.textContent = "No topics found for this unit.";
            units.appendChild(noTopicsMessage);
            return;
        }

        let ol = document.createElement("ol");
        let cnt = 1;

        unitTopics.forEach(topic => {
            if(topic.pdf != null){
                let li = document.createElement("li");
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
        units.appendChild(ol);
    } catch (error) {
        console.error("Error fetching topics:", error);
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
    } catch (error) {
        console.error("Error fetching subjects:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    abcd();
});
