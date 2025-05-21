#!/usr/bin/env node

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const status = require("./status.json");

const URL = "http://www.sarnetfl.org/system-status.html";
const lastUpdate = new Date().toLocaleString("en-US");

(async () =>{
  try {
    const response = await axios.get(URL);
    const $ = cheerio.load(response.data);
    const paragraphHtml = $(".paragraph").text();
    const lines = paragraphHtml.split(/\n+/);
    const siteRegex = /^(.+)\s+\((FB2|FX1)\):\s*(.+)$/i;
    for (let line of lines) {
      line = line.replace(/[^\x20-\x7E]+/g, "").trim().replace(/\s+/g, " ");
      const match = siteRegex.exec(line);
      if (match) {
        let found = false;
        match[3] = match[3].trim();
        if (!match[3].endsWith(".")) {
          match[3] += ".";
        }
        for (let index = 0; index < status.length && !found; index++) {
          found = match[1].toLowerCase().indexOf(status[index].site_name.toLowerCase()) != -1;
          if (found) {
            status[index].last_update = lastUpdate;
            status[index].notes = match[3];
            status[index].status = `${(match[3].toLowerCase().indexOf(" is operational") != -1) ? "On" : "Off"}-Air`;
          }
        }
        if (!found) {
          console.log("**", match);
          status.push(
            {
              "built": false,
              "county": "",
              "duplex": "+",
              "frequency": 0,
              "grid_zone": "",
              "hundred_km_id": "",
              "last_update": lastUpdate,
              "latitude": 25,
              "longitude": -85,
              "memory_label": "",
              "notes": match[3],
              "offset": 0,
              "region": "",
              "site_name": match[1].trim(),
              "status": `${(match[3].toLowerCase().indexOf(" is operational") != -1) ? "On" : "Off"}-Air`,
              "tone_frequency": 0,
              "type": match[2].toLocaleLowerCase() === "fx1" ? "Control Station (FX1)" : "Repeater (FB2)",
            },
          );
        }
      }
    }
    status.sort((a, b) => a.site_name.toLowerCase().localeCompare(b.site_name.toLowerCase()));
    let data = JSON.stringify(status, null, 1);
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
    status.filter(item => item.built).forEach((item) => {
      data += `\n\t\t\t<modem>\n\t\t\t\t<bandwidth>25000</bandwidth>\n\t\t\t\t<frequency>${item.frequency * 1000000}</frequency>\n\t\t\t\t<type>FM</type>\n\t\t\t\t<user_label>${(item.site_name + " (" + item.memory_label + ")").split("").map(char => "%" + char.charCodeAt(0).toString(16)).join("")}</user_label>\n\t\t\t\t<squelch_level>-31</squelch_level>\n\t\t\t\t<squelch_enabled>1</squelch_enabled>\n\t\t\t\t<gain>1</gain>\n\t\t\t\t<muted>0</muted>\n\t\t\t\t<active>1</active>\n\t\t\t</modem>`;
    });
    data += "\n\t\t</group>\n\t</modems>\n\t<recent_modems />\n</cubicsdr_bookmarks>";
    fs.writeFile("cubicsdr.xml", data, function (error) {
      if (error) return console.error(error);
    });
  } catch (error) {
    console.error("Error fetching SARNET status:", error.message);
  }
})();