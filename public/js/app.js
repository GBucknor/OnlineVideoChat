window.addEventListener('load', () => {
    const chatTempl = Handlebars.compile($('#chat-template').html());
    const chatConTempl = Handlebars.compile($('#chat-content-template').html());
    const chatElement = $('#chat');
    const formElement = $('.form');
    const messages = [];
    let username;

    // Client-Side Video
    const localImageEl = $('#local-image');
    const localVideoEl = $('#local-video');

    // Remote Videos
    const rVideoTempl = Handlebars.compile($('#remote-video-template').html());
    const remoteVids = $('#remote-v');
    let remoteVidCount = 0;

    formElement.form({
        fields: {
            roomName: 'empty',
            username: 'empty', 
        },
    });

    /*
        WEB RTC FUNCTIONS
    */

    // Instantiates WebRTC
    const wrtc = new SimpleWebRTC({
        localVideoEl: 'local-video',
        remoteVids: 'remote-v',
        autoRequestMedia: true,
    });

    // Runs video recording using the user's camera
    wrtc.on('localStream', () => {
        localImageEl.hide();
        localVideoEl.show();
    });

    // Displays chat messages that are sent to the room.
    wrtc.connection.on('message', (data) => {
        if (data.type === 'chat') {
            const message = data.payload;
            messages.push(message);
            updateChatMessages();
        }
    });

    // Adds a stream from a remote user that wants to join the room.
    wrtc.on('videoAdded', (video, peer) => {
        const id = wrtc.getDomId(peer);
        const remoteVidHtml = rVideoTempl({id});
        if (remoteVidCount === 0) {
            remoteVids.html(remoteVidHtml);
        } else {
            remoteVids.append(remoteVidHtml);
        }
        $(`#${id}`).html(video);
        $(`#${id} video`).addClass('ui image medium');
        remoteVidCount += 1;
    });

    $('.submit').on('click', (event) => {
        if (!formElement.form('is valid')) {
            return false;
        }

        username = $('#user').val();
        const roomName = $('#rName').val();

        if (event.target.id === 'create-btn') {
            createRoom(roomName);
        } else {
            joinRoom(roomName);
        }
        return false;
    });

    const createRoom = (roomName) => {
        console.info(`Creating room: ${roomName}`);
        wrtc.createRoom(roomName, (err, name) => {
            showChatRoom(name);
            postMessage(`${username} created the room.`);
        });
    };

    const joinRoom = (roomName) => {
        console.info(`Joining room: ${roomName}`);
        wrtc.joinRoom(roomName);
        showChatRoom(roomName);
        postMessage(`${username} joined the room`);
    };

    const postMessage = (message) => {
        const chatMessage = {
            username,
            message,
            postedOn: new Date().toLocaleString('en-GB'),
        };
        wrtc.sendToAll('chat', chatMessage);
        messages.push(chatMessage);
        $('#post-message').val('');
        updateChatMessages();
    };

    const showChatRoom = (room) => {
        formElement.hide();
        const chatHtml = chatTempl({room});
        chatElement.html(chatHtml);
        const postForm = $('form');
        postForm.form({
            message: 'empty',
        });
        $('#post-btn').on('click', () => {
            const message = $('#post-message').val();
            postMessage(message);
        });
        $('#post-message').on('keyup', (event) => {
            if (event.keyCode === 13) {
                const message = $('#post-message').val();
                postMessage(message);
            }
        })
    };

    const updateChatMessages = () => {
        const chatConHtml = chatConTempl({messages});
        const chatConEl = $('#chat-content');
        chatConEl.html(chatConHtml);
        const scrollHeight = chatConEl.prop('scrollHeight');
        chatConEl.animate({scrollTop: scrollHeight}, 'slow');
    };
});