const express = require("express");
const bodyParser = require("body-parser");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const expressFileUpload = require("express-fileupload");
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
    expressFileUpload({
        useTempFiles: true,
        tempFileDir: "tmp",
    })
);

ffmpeg.setFfmpegPath("C:/FFmpeg/bin/ffmpeg.exe");
ffmpeg.setFfprobePath("C:/FFmpeg/bin/ffprobe.exe");

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/convert', (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).send('No file was uploaded.');
    }

    const to = req.body.to;
    const file = req.files.file;
    const input_path = path.join("tmp", file.name);
    const outputFileName = `output.${to}`;
    const outputPath = path.join(__dirname, outputFileName);

    file.mv(input_path, function(err) {
        if (err) {
            console.error("Error moving file:", err);
            return res.status(500).send(err);
        }

        console.log("File uploaded successfully");

        ffmpeg(input_path)
            .toFormat(to)
            .on("end", function() {
                console.log("Conversion finished");                
                res.download(outputPath, outputFileName, function(err) {
                    fs.unlink(input_path, () => {});
                    fs.unlink(outputPath, () => {});
                    if (err) {
                        console.error("Error sending file:", err);
                    }
                });
            })
            .on("error", function(err) {
                console.error("Conversion error:", err);
                fs.unlink(input_path, () => {});
                if (fs.existsSync(outputPath)) {
                    fs.unlink(outputPath, () => {});
                }
                res.status(500).send("Conversion failed");
            })
            .save(outputPath);
    });
});

app.listen(4000, () => {
    console.log("App listening on port 4000");
});