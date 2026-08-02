(function () {
  "use strict";

  var ACCEPT_KEY = "ai_fw_advanced_ok";
  var tools = [
    ["Replika","replika","AI companions","adult"],
    ["Character.AI","character-ai","AI companions","adult"],
    ["Nomi.ai","nomi-ai","AI companions","adult"],
    ["CrowdStrike Charlotte","crowdstrike-charlotte","Threat detection","security"],
    ["SentinelOne Purple AI","sentinelone-purple-ai","Threat detection","security"],
    ["Darktrace","darktrace","Threat detection","security"],
    ["Sift","sift","Fraud detection","security"],
    ["Sardine","sardine","Fraud detection","security"],
    ["Feedzai","feedzai","Fraud detection","security"],
    ["Persona","persona","Identity verification","privacy"],
    ["Ollama","ollama","Open Source / Local LLMs","local"],
    ["LM Studio","lm-studio","Open Source / Local LLMs","local"],
    ["Jan.ai","jan-ai","Open Source / Local LLMs","local"],
    ["GPT4All","gpt4all","Open Source / Local LLMs","local"],
    ["Text Generation WebUI","text-generation-webui","Open Source / Local LLMs","local"],
    ["KoboldCPP","koboldcpp","Open Source / Local LLMs","local"],
    ["llama.cpp","llama-cpp","Open Source / Local LLMs","local"],
    ["vLLM","vllm","Open Source / Local LLMs","local"],
    ["Msty","msty","Open Source / Local LLMs","local"],
    ["Janitor AI","janitor-ai","Uncensored / Roleplay Chats","adult"],
    ["Chub.ai","chub-ai","Uncensored / Roleplay Chats","adult"],
    ["SpicyChat","spicychat","Uncensored / Roleplay Chats","adult"],
    ["CrushOn AI","crushon-ai","Uncensored / Roleplay Chats","adult"],
    ["Venus Chub","venus-chub","Uncensored / Roleplay Chats","adult"],
    ["SillyTavern","sillytavern-frontend","Uncensored / Roleplay Chats","adult"],
    ["Dolphin Mistral","dolphin-mistral-uncensored","Uncensored / Roleplay Chats","adult"],
    ["PentestGPT","pentestgpt","Specialized security model","security"],
    ["DeepFaceLab","deepfacelab","Deepfake / Face Swap","synthetic"],
    ["roop-unleashed","roop-unleashed","Deepfake / Face Swap","synthetic"],
    ["FaceFusion","facefusion","Deepfake / Face Swap","synthetic"],
    ["Remaker Face Swap","remaker-face-swap","Deepfake / Face Swap","synthetic"],
    ["Akool Face Swap","akool-face-swap","Deepfake / Face Swap","synthetic"],
    ["SWGfL Nude Imagery Guide","swgfl-nude-imagery-guide","Safety Resources","safety"],
    ["StopNCII.org","stopncii-org","Safety Resources","safety"],
    ["Take It Down (NCMEC)","take-it-down-ncmec","Safety Resources","safety"],
    ["CandyAI","candyai","AI Girlfriend / Companion","adult"],
    ["DreamGF","dreamgf","AI Girlfriend / Companion","adult"],
    ["Kupid AI","kupid-ai","AI Girlfriend / Companion","adult"],
    ["Muah AI","muah-ai","AI Girlfriend / Companion","adult"],
    ["Civitai","civitai","Uncensored Image Generation","adult"],
    ["Unstable Diffusion","unstable-diffusion","Uncensored Image Generation","adult"],
    ["SeaArt","seaart-uncensored-mode","Uncensored Image Generation","adult"],
    ["Yodayo","yodayo","Uncensored Image Generation","adult"],
    ["Hive Moderation","hive-moderation","Deepfake / Image Detectors","safety"],
    ["Sensity AI","sensity-ai","Deepfake / Image Detectors","safety"],
    ["Deepware Scanner","deepware-scanner","Deepfake / Image Detectors","safety"],
    ["AI or Not","ai-or-not","Deepfake / Image Detectors","safety"],
    ["Reality Defender","reality-defender","Deepfake / Image Detectors","safety"],
    ["OSINT Framework","osint-framework","OSINT","security"],
    ["Maltego","maltego","OSINT","security"],
    ["SpiderFoot","spiderfoot","OSINT","security"],
    ["IntelligenceX","intelligencex","OSINT","security"],
    ["Recon-ng","recon-ng","OSINT","security"],
    ["Shodan","shodan","OSINT","security"],
    ["Have I Been Pwned","have-i-been-pwned","OSINT","security"],
    ["OSINT Combine","osint-combine","OSINT","security"],
    ["Kali Linux","kali-linux","Ethical Hacking / Pen Testing","security"],
    ["Metasploit","metasploit","Ethical Hacking / Pen Testing","security"],
    ["Nuclei AI","nuclei-ai","Ethical Hacking / Pen Testing","security"],
    ["HackerOne","hackerone","Bug Bounty","security"],
    ["Bugcrowd","bugcrowd","Bug Bounty","security"],
    ["Intigriti","intigriti","Bug Bounty","security"],
    ["YesWeHack","yeswehack","Bug Bounty","security"],
    ["Autopsy","autopsy","Digital Forensics","security"],
    ["Magnet AXIOM","magnet-axiom","Digital Forensics","security"],
    ["Cellebrite","cellebrite","Digital Forensics","security"],
    ["FTK Imager","ftk-imager","Digital Forensics","security"],
    ["ANY.RUN","any-run","Malware Analysis","security"],
    ["Joe Sandbox","joe-sandbox","Malware Analysis","security"],
    ["Ghidra (NSA)","ghidra-nsa","Reverse Engineering","security"],
    ["IDA Pro","ida-pro","Reverse Engineering","security"],
    ["Binary Ninja","binary-ninja","Reverse Engineering","security"],
    ["radare2","radare2","Reverse Engineering","security"],
    ["Cutter","cutter","Reverse Engineering","security"],
    ["Wireshark","wireshark","Network Security","security"],
    ["Zeek","zeek","Network Security","security"],
    ["Snort","snort","Network Security","security"],
    ["Recorded Future","recorded-future","Threat Intelligence","security"],
    ["Mandiant","mandiant","Threat Intelligence","security"],
    ["CrowdStrike Falcon Intel","crowdstrike-falcon-intel","Threat Intelligence","security"],
    ["SOCRadar","socradar","Threat Intelligence","security"],
    ["AlienVault OTX","alienvault-otx","Threat Intelligence","security"],
    ["DarkOwl","darkowl","Dark Web Monitoring","security"],
    ["Flashpoint","flashpoint","Dark Web Monitoring","security"],
    ["Constella","constella","Dark Web Monitoring","security"],
    ["SpyCloud","spycloud","Dark Web Monitoring","security"],
    ["Splunk AI","splunk-ai","Threat Hunting / SIEM","security"],
    ["Elastic Security","elastic-security","Threat Hunting / SIEM","security"],
    ["TheHive Project","thehive-project","Incident Response","security"],
    ["Cortex XSOAR","cortex-xsoar","Incident Response","security"],
    ["Tines","tines","Incident Response","security"],
    ["Torq","torq","Incident Response","security"],
    ["Signal","signal","Privacy & Encryption","privacy"],
    ["ProtonMail","protonmail","Privacy & Encryption","privacy"],
    ["Tails OS","tails-os","Privacy & Encryption","privacy"],
    ["Tor Browser","tor-browser","Privacy & Encryption","privacy"],
    ["VeraCrypt","veracrypt","Privacy & Encryption","privacy"],
    ["Secureframe","secureframe","Compliance","privacy"],
    ["OneTrust","onetrust","Compliance","privacy"],
    ["TinEye","tineye","Investigation / Reverse Image Search","security"]
  ];

  var gate = document.getElementById("advanced-gate");
  var directory = document.getElementById("advanced-directory");
  var confirm = document.getElementById("policy-confirmation");
  var enter = document.getElementById("enter-advanced");
  var grid = document.getElementById("advanced-grid");
  var search = document.getElementById("advanced-search");
  var filter = document.getElementById("advanced-filter");
  var count = document.getElementById("visible-count");
  var empty = document.getElementById("advanced-empty");

  function badgeLabel(group) {
    if (group === "adult") return "18+";
    if (group === "safety") return "Safety";
    if (group === "synthetic") return "High risk";
    if (group === "local") return "Local";
    if (group === "privacy") return "Privacy";
    return "Technical";
  }

  function description(category, group) {
    if (group === "adult") return "Adults only. Review the provider's consent, age, privacy, and content rules before use.";
    if (group === "synthetic") return "Synthetic-media tool. Use only with authorization and never for non-consensual intimate content or impersonation.";
    if (group === "safety") return "Detection, reporting, or support resource for safer and more accountable AI use.";
    if (group === "local") return "Local or open-model tooling for users who need more control over models, data, and deployment.";
    if (group === "privacy") return "Privacy, encryption, identity, or governance tooling. Confirm current security and compliance claims.";
    return "Technical security or research resource. Use only on systems and data you are authorized to access.";
  }

  function render() {
    var query = (search.value || "").trim().toLowerCase();
    var selected = filter.value;
    var matches = tools.filter(function (tool) {
      var groupMatch = selected === "all" || tool[3] === selected;
      var textMatch = !query || (tool[0] + " " + tool[2]).toLowerCase().indexOf(query) >= 0;
      return groupMatch && textMatch;
    });

    grid.innerHTML = "";
    matches.forEach(function (tool) {
      var card = document.createElement("article");
      card.className = "advanced-card";
      card.innerHTML =
        '<div class="advanced-card-top">' +
          '<h2><a href="/tool/' + tool[1] + '">' + tool[0] + '</a></h2>' +
          '<span class="badge ' + tool[3] + '">' + badgeLabel(tool[3]) + '</span>' +
        '</div>' +
        '<p>' + description(tool[2], tool[3]) + '</p>' +
        '<span class="category">' + tool[2] + '</span>' +
        '<div class="card-actions">' +
          '<a href="/tool/' + tool[1] + '">Profile</a>' +
          '<a href="/go/' + tool[1] + '" target="_blank" rel="sponsored nofollow noopener">Visit provider</a>' +
        '</div>';
      grid.appendChild(card);
    });
    count.textContent = String(matches.length);
    empty.hidden = matches.length !== 0;
  }

  function openDirectory() {
    gate.hidden = true;
    directory.hidden = false;
    render();
  }

  confirm.addEventListener("change", function () {
    enter.disabled = !confirm.checked;
  });
  enter.addEventListener("click", function () {
    if (!confirm.checked) return;
    sessionStorage.setItem(ACCEPT_KEY, "1");
    openDirectory();
  });
  search.addEventListener("input", render);
  filter.addEventListener("change", render);

  if (sessionStorage.getItem(ACCEPT_KEY) === "1") openDirectory();
})();
