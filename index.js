// const fs = require('fs');
// const https = require('https');
// const { exec } = require('child_process');
const express = require('express');
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = 3000;

const subArray = [];
app.use(cors());

app.use(express.static(require('path').join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile('index.html');
});

app.get('/getSub', async (req, res) => {
    try {
        await getSubjects();
        res.json({ "sub": subArray });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/getUnits/:sub', async (req, res) => {
    try {
        const subjects = await getSubjects();
        const units = await getUnits(subjects[req.params.sub]);
        res.json({ "units": units });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/proxy-pdf/:pdfUrl', async (req, res) => {
    try {
        const pdfUrl = decodeURIComponent(req.params.pdfUrl);
        const response = await fetch(pdfUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }

        // Read response data as a stream
        const pdfStream = response.body;

        // Convert stream to buffer
        let pdfBuffer = Buffer.alloc(0);
        for await (const chunk of pdfStream) {
            pdfBuffer = Buffer.concat([pdfBuffer, chunk]);
        }

        // Set response headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="downloaded.pdf"');
        
        // Send PDF buffer as response
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error proxying PDF:', error);
        res.status(500).send('Error proxying PDF');
    }
});

// Route to get topics for a specific unitId
app.get('/getTopics/:unitId', async (req, res) => {
    try {
        const topics = await getTopics(req.params.unitId);
        res.json({ "topics": topics });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}`);
});

async function getSubjects() {
    try {
        const response = await fetch(process.env.SUB, {
            headers: {
                Authorization: process.env.AUTH
            }
        });
        const data = await response.json();
        const newObj = data.payload
            .filter(item => item.yearsemester_code === 'III-II')
            .reduce((acc, item) => {
                acc[item.subject_name] = item.subject_id;
                return acc;
            }, {});
        if (subArray.length === 0) {
            for (let i in newObj) subArray.push(i);
        }
        return newObj;
    } catch (error) {
        throw error;
    }
}

async function getTopics(unitId) {
    try {
        const response = await fetch(`${process.env.TOPIC}${unitId}`, {
            headers: {
                Authorization: process.env.AUTH
            }
        });
        const data = await response.json();
        return data.payload.topics;
    } catch (error) {
        throw error;
    }
}

async function getUnits(subid) {
    try {
        const response = await fetch(`${process.env.UNIT}${subid}`, {
            headers: {
                Authorization: process.env.AUTH
            }
        });
        const data = await response.json();
        const newObj = data.payload.reduce((acc, item) => {
            acc[item.unitName] = item.unitId;
            return acc;
        }, {});
        return newObj;
    } catch (error) {
        throw error;
    }
}



/*
function downloadPdf(url, folder) {
    return new Promise((resolve, reject) => {
        const filename = url.split('/').pop();
        const filepath = `${folder}/${filename}`;
        const file = fs.createWriteStream(filepath);

        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve(filepath));
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => reject(err));
        });
    });
}

async function main(jsonFile, folder) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }

    try {
        const jsonData = fs.readFileSync(jsonFile);
        const data = JSON.parse(jsonData);

        const downloadedPdfs = [];
        for (const entry of data) {
            const pdfUrl = entry.pdf;
            if (pdfUrl) {
                const pdfPath = await downloadPdf(pdfUrl, folder);
                downloadedPdfs.push(pdfPath);
            }
        }

        // Example: Execute a command to get the number of pages in each PDF
        for (const pdfPath of downloadedPdfs) {
            exec(`pdfinfo ${pdfPath} | grep Pages`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error occurred while getting page count for ${pdfPath}: ${error}`);
                    return;
                }
                console.log(`Number of pages in ${pdfPath}: ${stdout.trim()}`);
            });
        }
    } catch (err) {
        console.error(`An error occurred: ${err}`);
    }
}

// Example usage:
const jsonFile = 'data.json'; // Change this to your JSON file path
const folder = ''; // Change this to your desired folder path
main(jsonFile, folder);
*/