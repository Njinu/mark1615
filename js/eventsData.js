// eventsData.js
const eventsData = { 
  "event1": {
      name: "Evangelism Drive",
      location: "Rosebank Mall (Starbucks)",
      date: "2025-10-18",
      description: "Join us for an evangelism drive at Rosebank Mall. We are sharing the gospel with the public and inviting them to learn more about Jesus and the good news he brought.",
      url: "./event.html?event=event1",
      lumaUrl: "https://lu.ma/event/evt-mT9eZi8AWyp7iJB",
      lumaEventId: "evt-mT9eZi8AWyp7iJB",
      time: "12:30 AM",
      image:"img/9.jpg",
      type:"event",
      recurrence: {
        freq: "biweekly",
        interval: 2,
        startDate: "2025-10-18"
      }
  },
  "event2": {
      name: "Bible Donations",
      location: "General - Johannesburg",
      date: "2025-10-31",
      description: "We are collecting bibles and funds to purchase Bibles and distribute them to communities that lack access to the Word of God. Each NT bible we buy is R17.00",
      url: "./event.html?event=event2",
      lumaUrl: "https://lu.ma/event/evt-UmMdc7pOwBCuYiS",
      lumaEventId: "evt-UmMdc7pOwBCuYiS",
      time: "10:00 AM",
      image:"img/11.jpg",
      type:"donation",
      recurrence: {
        freq: "monthly",
        when: "endOfMonth"
      }
  },
  "event3": {
      name: "Clothes Drive",
      location: "WaterWorks Soweto",
      date: "2025-10-31",
      description: "Join us for a recurring clothes drive at WaterWorks Soweto. We are distributing gently used clothing items to those in need.",
      url: "./event.html?event=event3",
      lumaUrl: "https://lu.ma/event/evt-4woKzE4OOkIq0cT",
      lumaEventId: "evt-4woKzE4OOkIq0cT",
      time: "11:00 AM",
      image:"img/2.jpg",
      type:"event",
      recurrence: {
        freq: "once",
        date: "2025-10-31"
      }
  }
  ,
  "event4": {
    name: "TikTok Live",
    location: "Online (TikTok)",
    date: "2025-10-20",
    description: "Join our TikTok Live sessions for prayer, encouragement, and sharing the Word. Everyone is welcome!",
    url: "#",
    lumaUrl: "",
    lumaEventId: "",
    time: "19:30",
    // image: "img/tt.png",
    type: "event",
    recurrence: {
      freq: "weekly",
      daysOfWeek: [1,3,5], // Monday, Wednesday, Friday
      time: "19:30"
    }
  },
  "event5": {
    name: "WhatsApp Prayer Circle",
    location: "Online (WhatsApp)",
    date: "2025-10-21",
    description: "Join our WhatsApp Prayer Circle for intercession and encouragement. Open to all!",
    url: "#",
    lumaUrl: "",
    lumaEventId: "",
    time: "20:00",
    // image: "img/whatsapp.png",
    type: "event",
    recurrence: {
      freq: "weekly",
      daysOfWeek: [2,4], // Tuesday, Thursday
      time: "20:00"
    }
  }
};
