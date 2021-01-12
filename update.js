#!/usr/bin/env node

const https = require("https");
const status = require("./status.json");
const fs = require("fs");

status.forEach((item) => {
    item.last_update = new Date().toLocaleString("en-US");
    item.notes = "";
    item.status = "Unknown";
});

https.get("https://www.sarnetfl.com/system-status.html", (res) => {
    let data = "";
    res.on("data", (chunk) => {
        data += chunk;
    });
    res.on("end", () => {
        try {
            let lines = data.split("\n");
            data = "";
            lines.forEach((line) => {
                data += ((line.indexOf("(FB2)") != -1 || line.indexOf("(FX1)") != -1) && line.indexOf("meta property") == -1 ? line.trim().replace(/&#[0-9]*;/gi, "") : "")
            });
            data = data.replace(/\s{2,}/gi, "");
            data = data.replace(/(&nbsp;)+/gi, " ");
            data = data.replace(/(<\s*br\s*\/>)+/gi, "\n");
            data = data.replace(/<[^>]*>+/gi, "");
            lines = data.split("\n");
            status.forEach((item) => {
                for (let index = 0; index < lines.length && item.status === "Unknown"; index++) {
                    lines[index] = lines[index].trim();
                    if (lines[index].toLowerCase().indexOf(item.site_name.toLowerCase()) != -1) {
                        item.status = `${(lines[index].toLowerCase().indexOf(" is operational") != -1) ? "On" : "Off"}-Air`;
                        item.notes = `${lines[index].split(":")[1]}`.trim();
                    }
                }
            });
            data = JSON.stringify(status, null, 1);
            fs.writeFile("status.json", data, function (error) {
                if (error) return console.error(error);
            });
            fs.writeFile("status.js", `SARnetStatus = ${data};`, function (error) {
                if (error) return console.error(error);
            });
            data = "";
            status.forEach((item) => {
                data += `\n${item.site_name} ${item.type}: ${item.notes}`;
            });
            fs.writeFile("status.txt", `Last Update : ${new Date().toLocaleString("en-US")}\n${data}`, function (error) {
                if (error) return console.error(error);
            });
            data = "";
            status.forEach((item) => {
                data += `\n"${item.site_name}","${item.memory_label}",${item.frequency},${item.tone_frequency},"${item.built ? "Yes" : "No"}","${item.type}","${item.county}","${item.region}","${item.grid_zone}","${item.hundred_km_id}","${item.status}","${item.notes}","${new Date().toLocaleString("en-US")}"`;
            });
            fs.writeFile("status.csv", `"Site Name","Memory Label","TX (MHz)","Tone (Hz)","Built","Type","County","Region","Grid Zone","100 Km ID","Status","Notes","Last Update"${data}`, function (error) {
                if (error) return console.error(error);
            });
            data = "";
            status.filter(item => item.built).forEach((item, index) => {
                data += `\n${index},${item.memory_label},${item.frequency},+,${item.offset},Tone,${item.tone_frequency},${item.tone_frequency},023,NN,FM,5.00,,${item.site_name},,,,`;
            });
            console.log(data);
            fs.writeFile("chirp.csv", `Location,Name,Frequency,Duplex,Offset,Tone,rToneFreq,cToneFreq,DtcsCode,DtcsPolarity,Mode,TStep,Skip,Comment,URCALL,RPT1CALL,RPT2CALL,DVCODE${data}`, function (error) {
                if (error) return console.error(error);
            });
        } catch (exception) {
            console.error(exception.message);
        }
    });
    res.on("error", (e) => {
        console.error(e);
    });
});