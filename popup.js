document.addEventListener('DOMContentLoaded', () => {
    const snippetForm = document.getElementById('snippetForm');
    const snippetsDiv = document.getElementById('snippets');
    const tabs = document.querySelectorAll('.tab');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const isDarkMode = localStorage.getItem('resume-snippet-mode') === "dark"
    if (isDarkMode){
        document.body.classList.add("dark-mode")
    }
  
    // Load saved snippets
    chrome.storage.sync.get(['snippets'], (result) => {
        const snippets = result.snippets || [];
        snippets.forEach((snippet, index) => addSnippetToDOM(snippet, index));
    });
  
    snippetForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const title = document.getElementById('snippetTitle').value;
        const content = document.getElementById('snippetContent').value;
        const category = document.getElementById('snippetCategory').value;
  
        const snippet = { title, content, category };
        chrome.storage.sync.get(['snippets'], (result) => {
            const snippets = result.snippets || [];
            snippets.push(snippet);
            chrome.storage.sync.set({ snippets }, () => {
                snippetsDiv.innerHTML = '';
                snippets.forEach((snippet, index) => addSnippetToDOM(snippet, index));
            });
        });
  
        snippetForm.reset();
    });
  
    function addSnippetToDOM(snippet, index) {
        const snippetDiv = document.createElement('div');
        snippetDiv.className = 'snippet';
        snippetDiv.dataset.category = snippet.category;
  
        const snippetTitle = document.createElement('span');
        snippetTitle.textContent = snippet.title;
        snippetDiv.appendChild(snippetTitle);
  
        const controls = document.createElement('div');
        controls.className = 'snippetControls';
  
        const copyButton = document.createElement('button');
        copyButton.innerHTML = '<img src="./copy.png" width="15" height="15" />';
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(snippet.content);
            alert('Content copied to clipboard');
        });
        controls.appendChild(copyButton);
  
        const editButton = document.createElement('button');
        editButton.innerHTML = '<img src="./pencil.png" width="15" height="15" />';
        editButton.addEventListener('click', () => {
            editSnippet(index);
        });
        controls.appendChild(editButton);
  
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<img src="./remove.png" width="15" height="15" />';
        deleteButton.addEventListener('click', () => {
            deleteSnippet(index);
        });
        controls.appendChild(deleteButton);
  
        snippetsDiv.appendChild(snippetDiv);
        snippetDiv.appendChild(controls);
    }
  
    function editSnippet(index) {
        chrome.storage.sync.get(['snippets'], (result) => {
            const snippets = result.snippets || [];
            const snippet = snippets[index];
            document.getElementById('snippetTitle').value = snippet.title;
            document.getElementById('snippetContent').value = snippet.content;
            document.getElementById('snippetCategory').value = snippet.category;
  
            snippets.splice(index, 1); // Remove the snippet to be edited
            chrome.storage.sync.set({ snippets }, () => {
                snippetsDiv.innerHTML = ''; // Clear the DOM
                snippets.forEach((snippet, idx) => addSnippetToDOM(snippet, idx));
            });
        });
    }
  
    function deleteSnippet(index) {
        chrome.storage.sync.get(['snippets'], (result) => {
            const snippets = result.snippets || [];
            snippets.splice(index, 1);
            chrome.storage.sync.set({ snippets }, () => {
                snippetsDiv.innerHTML = '';
                snippets.forEach((snippet, idx) => addSnippetToDOM(snippet, idx));
            });
        });
    }
  
    document.getElementById('searchBar').addEventListener('input', (event) => {
        const query = event.target.value.toLowerCase();
        const snippetDivs = document.querySelectorAll('.snippet');
        snippetDivs.forEach(div => {
            const title = div.querySelector('span').textContent.toLowerCase();
            if (title.includes(query)) {
                div.style.display = 'flex';
            } else {
                div.style.display = 'none';
            }
        });
    });
  
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const category = tab.dataset.category;
            filterSnippets(category);
            document.getElementById('searchBar').value = ''; 
        });
    });
  
    function filterSnippets(category) {
        const snippetDivs = document.querySelectorAll('.snippet');
        snippetDivs.forEach(div => {
            if (category === 'all' || div.dataset.category === category) {
                div.style.display = 'flex';
            } else {
                div.style.display = 'none';
            }
        });
    }
  
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains("dark-mode")){
            localStorage.setItem("resume-snippet-mode", "dark")
        } else {
            localStorage.setItem("resume-snippet-mode", "light")
        }
    });
  
    document.getElementById('exportButton').addEventListener('click', () => {
        chrome.storage.sync.get(['snippets'], (result) => {
            const snippets = result.snippets || [];
            const blob = new Blob([JSON.stringify(snippets)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'snippets.json';
            a.click();
            URL.revokeObjectURL(url);
        });
    });
  
    document.getElementById('importButton').addEventListener('change', (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const snippets = JSON.parse(e.target.result);
            chrome.storage.sync.set({ snippets }, () => {
                snippetsDiv.innerHTML = '';
                snippets.forEach((snippet, index) => addSnippetToDOM(snippet, index));
            });
        };
        reader.readAsText(file);
    });
  });
  