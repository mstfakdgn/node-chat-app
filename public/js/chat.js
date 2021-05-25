const socket = io();

// server (emit) -> client (receive) --acknowledgement--> server
// client (emit) -> server (receive) --acknowledgement--> client

// socket.on('countUpdated', (count) => {
//     console.log('The count has been updated', count);
// })

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('Clicked');
//     socket.emit('increment')
// })

// Elements

const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("#message");
const $messageFormButton = $messageForm.querySelector("button");

const $messages = document.querySelector("#messages");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // New message
  const $newMessage = $messages.lastElementChild

  // Hieght of the new message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = $messages.offsetHeight

  // Height of messages container
  const containerHeight = $messages.scrollHeight

  // How far have I scrolled
  const scrollOffset = $messages.scrollTop +visibleHeight

  if (containerHeight - newMessageHeight <= scrollOffset)  {
    $messages.scrollTop = $messages.scrollHeight
  }
  
}

socket.on("welcome", (message) => {
    console.log('where is username',message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll()
});

socket.on("locationMessage", (locationUrl) => {
  const html = Mustache.render(locationTemplate, {
    username: locationUrl.username,
    locationUrl: locationUrl.url,
    createdAt: moment(locationUrl.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll()
});

socket.on('roomData', ({room, users}) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.message.value;

  e.target.elements.message.value = "";
  e.target.elements.message.focus();

  socket.emit("clientMessage", message, (error) => {
    $messageFormButton.removeAttribute("disabled");
    if (error) {
      return console.log(error);
    }
    console.log("Message Delivered!");
  });
});

const $locationButton = document.querySelector("#send-location");

$locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supoorted by your browser");
  }

  $locationButton.setAttribute("disabled", "diabled");

  navigator.geolocation.getCurrentPosition((position) => {
    positionData = {
      latitute: position.coords.latitude,
      longitute: position.coords.longitude,
    };
    socket.emit("sendLocation", positionData, (error) => {
      $locationButton.removeAttribute("disabled");
      if (error) {
        return console.log(error);
      }
      console.log("Location Shared!");
    });
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
