import re
import requests
from io import StringIO
from html.parser import HTMLParser
import datetime
from string import Template

class MLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs= True
        self.text = StringIO()
    def handle_data(self, d):
        self.text.write(d)
    def get_data(self):
        return self.text.getvalue()

def strip_tags(html):
    s = MLStripper()
    s.feed(html)
    return s.get_data()

labels = {"Andytown": "SNJBRO", "Apalachicola": "WFTFRA", "Brooksville": "CLMHER", "Central Turnpike": "CMLOSC", "Chattahoochee": "WGUGAD", "Chiefland": "NLNLEV", "Chipley": "WFVWAG", "Clermont": "CMMLAK", "Cocoa": "CNMBRE", "Crestview": "WEVOKA", "Daytona": "NMNVOL", "Dundee": "CMLPOL", "Estero": "SMKLEE", "Ft. Lauderdale": "SNJBRO", "Florida City": "SNJDAD", "Ft. Myers": "SMKLEE", "Gainesville": "NLNALC", "Islamorada": "KNHMON", "Jacksonville": "NMPDUV", "Key West": "KMHMON", "Lake City": "NLPCLM", "Lakeland": "CMMPOL", "Live Oak": "NLPSUW", "Madison": "NKPMAD", "Miami": "SNJDAD", "Milton": "WDUSAN", "Naples": "SMJCLR", "Ocala": "NLNMAO", "Orlando": "CMMORA", "Pahokee": "SNKPAL", "Palm Beach": "SNKPAL", "Panama City": "WFUBAY", "Pensacola": "WDUESC", "Perry": "NKPTAY", "Sarasota": "CLLSAR", "Sebastian": "CNLBRE", "State Emergency Operations Center (SEOC), ESF2": "WGULEO", "Skyway Bridge": "CLLPIN", "St. Augustine": "NMPSTJ", "Stuart": "CNLMRT", "Tallahassee": "WGULEO", "Tampa": "CLLHIL", "Yulee": "NMPNAS"}

result = dict()
label_regex = ""
for key in labels:
	result[labels[key] + "_status"] = "Off-Air"
	result[labels[key] + "_style"] = "offair"
	result[labels[key] + "_notes"] = "Status is unknown."
	result[labels[key] + "_update"] = "Unknown"
	if label_regex:
		label_regex = label_regex + "|"
	label_regex = label_regex + key.split(" (")[0]
	
request = requests.get("https://www.sarnetfl.com/system-status.html")

last_update = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S") + "Z"

text = strip_tags(request.text)
text = re.sub(r"(" + label_regex + ")", r"\n\1", text)
text = re.sub(r"[^A-Za-z0-9 \n'.,:()]", "", text)
text = re.sub(r"^(?!" + label_regex + ").*$", r"", text, flags=re.MULTILINE)
text = re.sub(r"^\s*$", "", text, flags=re.MULTILINE)
text = re.sub(r"\s+$", "", text, flags=re.MULTILINE)
text = re.sub(r"([^.])$", r"\1.", text, flags=re.MULTILINE)
text = re.sub(r"[)]\s*:\s*", ") : ", text, flags=re.MULTILINE)

file = open("SARnet.txt", "wt")
file.write("Last Update : " + last_update + "\n" + text)
file.close()

result["NLNLEV_style"] = "planned"
result["NMNVOL_style"] = "planned"
result["CMLPOL_style"] = "planned"
result["SMKLEE_style"] = "planned"
result["KMHMON_style"] = "planned"
result["SNKPAL_style"] = "planned"
result["WDUESC_style"] = "planned"

for line in text.splitlines():
	if line:
		line = line.split(" : ")
		line[0] = re.sub(r" \((FB2|FX1)\)", "", line[0])
		result[labels[line[0]] + "_notes"] = line[1]
		if "site is operational" in line[1].lower():
			result[labels[line[0]] + "_status"] = "On-Air"
			result[labels[line[0]] + "_style"] = "onair"
		result[labels[line[0]] + "_update"] = last_update

file = open("template.csv", "r")
text = file.read()
file.close()

file = open("SARnet.csv", "wt")
file.write(Template(text).safe_substitute(result))
file.close()

print(Template(text).safe_substitute(result))