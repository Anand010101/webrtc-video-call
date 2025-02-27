let localStream, remoteStream, peerConnection;
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
const dataChannelOptions = { ordered: true };

// Get video elements
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

// Start video stream
async function startCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    peerConnection = new RTCPeerConnection(config);
    
    // Add tracks to peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Create data channel for messaging
    const dataChannel = peerConnection.createDataChannel("chat", dataChannelOptions);
    setupDataChannel(dataChannel);

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("New ICE candidate: ", event.candidate);
        }
    };
}

// Create an SDP Offer
async function generateOffer() {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    document.getElementById("offer").value = JSON.stringify(offer);
}

// Connect using copied SDP
async function connect() {
    const remoteOffer = JSON.parse(document.getElementById("offer").value);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(remoteOffer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    document.getElementById("answer").value = JSON.stringify(answer);

    peerConnection.ondatachannel = (event) => {
        setupDataChannel(event.channel);
    };
}

// Copy offer to clipboard
function copyOffer() {
    navigator.clipboard.writeText(document.getElementById("offer").value);
}

// Copy answer to clipboard
function copyAnswer() {
    navigator.clipboard.writeText(document.getElementById("answer").value);
}

// Setup Data Channel for Messaging
function setupDataChannel(channel) {
    channel.onmessage = (event) => {
        document.getElementById("chat").innerHTML += `<p>Peer: ${event.data}</p>`;
    };
    window.sendMessage = () => {
        const message = document.getElementById("message").value;
        channel.send(message);
        document.getElementById("chat").innerHTML += `<p>You: ${message}</p>`;
    };
}

// Toggle audio
function toggleAudio() {
    localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
}

// Toggle video
function toggleVideo() {
    localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
}
