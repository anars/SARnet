#!/usr/bin/env node

const http = require("http");
const status = require("./status.json");
const fs = require("fs");

status.forEach((item) => {
    item.last_update = new Date().toLocaleString("en-US");
    item.notes = "";
    item.status = "Unknown";
});

http.get("http://www.sarnetfl.com/system-status.html", (res) => {
    let data = "";
    res.on("data", (chunk) => {
        data += chunk;
        // console.log(data);
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
            fs.writeFile("chirp.csv", `Location,Name,Frequency,Duplex,Offset,Tone,rToneFreq,cToneFreq,DtcsCode,DtcsPolarity,Mode,TStep,Skip,Comment,URCALL,RPT1CALL,RPT2CALL,DVCODE${data}`, function (error) {
                if (error) return console.error(error);
            });
            // Export to CubicSDR bookmark file
            data = "<?xml version=\"1.0\" ?>\n<cubicsdr_bookmarks>\n\t<header>\n\t\t<version>%30%2e%32%2e%34</version>\n\t</header>\n\t<branches>\n\t\t<active>0</active>\n\t\t<range>0</range>\n\t\t<bookmark>1</bookmark>\n\t\t<recent>0</recent>\n\t</branches>\n\t<ranges />\n\t<modems>\n\t\t<group name=\"SARNet\" expanded=\"true\">";
            status.filter(item => item.built).forEach((item, index) => {
                data += `\n\t\t\t<modem>\n\t\t\t\t<bandwidth>25000</bandwidth>\n\t\t\t\t<frequency>${item.frequency * 1000000}</frequency>\n\t\t\t\t<type>FM</type>\n\t\t\t\t<user_label>${(item.site_name + " (" + item.memory_label + ")").split("").map(char => "%" + char.charCodeAt(0).toString(16)).join("")}</user_label>\n\t\t\t\t<squelch_level>-31</squelch_level>\n\t\t\t\t<squelch_enabled>1</squelch_enabled>\n\t\t\t\t<gain>1</gain>\n\t\t\t\t<muted>0</muted>\n\t\t\t\t<active>1</active>\n\t\t\t</modem>`;
            });
            data += "\n\t\t</group>\n\t</modems>\n\t<recent_modems />\n</cubicsdr_bookmarks>";
            fs.writeFile("cubicsdr.xml", data, function (error) {
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
