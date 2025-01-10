document.getElementById("bookmark").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab.url.includes("youtube.com/watch")) {
      chrome.tabs.sendMessage(activeTab.id, { action: "getVideoDetails" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError);
          alert("Error: Could not communicate with the YouTube page.");
        } else if (response.error) {
          alert(response.error);
        } else {
          const { title, description, timestamp, thumbnailUrl } = response;  // Extract thumbnailUrl
          saveBookmark(title, timestamp, description, thumbnailUrl);  // Pass thumbnailUrl
        }
      });
    } else {
      alert("This is not a valid YouTube video page.");
    }
  });
});

document.getElementById("clear").addEventListener("click", () => {
  clearBookmarks();
});

function saveBookmark(title, timestamp, description, thumbnailUrl) {  // Added thumbnailUrl parameter
  chrome.storage.local.get({ bookmarks: [] }, (data) => {
    const bookmarks = data.bookmarks;
    bookmarks.push({
      title,
      timestamp,
      description,
      thumbnailUrl,  // Store the thumbnailUrl
      formattedTime: formatTime(timestamp)
    });
    chrome.storage.local.set({ bookmarks }, () => {
      loadBookmarks();
    });
  });
}

function clearBookmarks() {
  chrome.storage.local.set({ bookmarks: [] }, () => {
    loadBookmarks(); // Refresh the bookmarks list
    alert("All bookmarks have been cleared.");
  });
}

// In popup.js, update the loadBookmarks function to handle data URLs
function loadBookmarks() {
  chrome.storage.local.get({ bookmarks: [] }, (data) => {
    const bookmarksList = document.getElementById("bookmarks");
    bookmarksList.innerHTML = "";
    data.bookmarks.forEach((bookmark, index) => {
      const li = document.createElement("li");

      // Thumbnail
      const thumbnailDiv = document.createElement("div");
      thumbnailDiv.className = "thumbnail";
      if (bookmark.thumbnailUrl) {
        const img = document.createElement("img");
        img.src = bookmark.thumbnailUrl;
        img.alt = "Frame Thumbnail";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        thumbnailDiv.appendChild(img);
      } else {
        thumbnailDiv.innerHTML = `<div class="no-thumbnail">No Frame</div>`;
      }

      // Content (title, timestamp, description)
      const contentDiv = document.createElement("div");
      contentDiv.className = "content";
      contentDiv.innerHTML = `
        <strong>${bookmark.title}</strong>
        <span>${bookmark.formattedTime}</span>
        <small>${bookmark.description || "No description"}</small>
      `;

      // Delete button
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("data-index", index);

      // Append elements
      li.appendChild(thumbnailDiv);
      li.appendChild(contentDiv);
      li.appendChild(deleteButton);

      // Add click handlers
      li.addEventListener("click", (event) => {
        if (!event.target.classList.contains("delete-button")) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "setTime", time: bookmark.timestamp }, (response) => {
              if (chrome.runtime.lastError) {
                console.error("Error sending message:", chrome.runtime.lastError);
                alert("Error: Could not communicate with the YouTube page.");
              } else if (!response || !response.success) {
                alert("Failed to jump to the bookmark. Please try again.");
              }
            });
          });
        }
      });

      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        const index = deleteButton.getAttribute("data-index");
        deleteBookmark(index);
      });

      bookmarksList.appendChild(li);
    });
  });
}

function deleteBookmark(index) {
  chrome.storage.local.get({ bookmarks: [] }, (data) => {
    const bookmarks = data.bookmarks;
    bookmarks.splice(index, 1); // Remove the bookmark at the specified index
    chrome.storage.local.set({ bookmarks }, () => {
      loadBookmarks(); // Refresh the bookmarks list
    });
  });
}

function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Load bookmarks when the popup opens
loadBookmarks();