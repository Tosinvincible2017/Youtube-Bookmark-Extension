// content.js
console.log("Content script loaded on YouTube page.");

function captureVideoFrame(video) {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // Set canvas size to match our desired thumbnail size
  canvas.width = 200;  // We'll set this larger and let CSS handle the display size
  canvas.height = 200;
  
  try {
    // Draw the current frame of the video onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Convert the canvas to a data URL
    return canvas.toDataURL('image/jpeg', 0.7); // Using JPEG with 0.7 quality for smaller size
  } catch (e) {
    console.error("Error capturing video frame:", e);
    return null;
  }
}

function getVideoDetails() {
  const video = document.querySelector("video");
  if (!video) {
    return { error: "No video found on this page." };
  }

  // Capture the current frame
  const currentFrame = captureVideoFrame(video);
  
  // Updated selector for the video title
  const title = document.querySelector("#title h1 yt-formatted-string")?.innerText.trim() || "Untitled Video";

  // Updated selector for the video description
  const description = document.querySelector("#description-inline-expander yt-formatted-string") ||
                     document.querySelector("#description > yt-formatted-string") ||
                     document.querySelector("#description yt-formatted-string");

  return {
    title,
    description: description ? description.innerText.trim() : null,
    timestamp: video.currentTime,
    thumbnailUrl: currentFrame  // Use the captured frame instead of video thumbnail
  };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getVideoDetails") {
    const details = getVideoDetails();
    sendResponse(details);
  } else if (request.action === "setTime") {
    const video = document.querySelector("video");
    if (video) {
      video.currentTime = request.time;
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
  }
  return true; // Required for async response
});