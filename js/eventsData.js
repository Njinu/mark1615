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
      name: "Food Drive Donation",
      location: "WaterWorks Soweto",
      date: "2025-10-31",
      description: "Support our bi-weekly food drive at WaterWorks Soweto. Every meal costs around R18.00 and consists of a starch, vegetable stew and chicken. Your donation helps us feed those in need.",
      url: "./event.html?event=event2",
      donationUrl: "https://www.backabuddy.co.za/campaign/monthly-food-drive",
      lumaUrl: "",
      lumaEventId: "",
      time: "10:00 AM",
      image:"img/1.jpg",
      type:"donation",
      recurrence: {
        freq: "biweekly",
        interval: 2,
        startDate: "2025-10-31"
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
  },
  "event_aug1": {
    name: "Evangelize",
    location: "Braamfontein",
    date: "2026-08-01",
    description: "Come join us for Evangelism Day in Braamfontein as we head out together to share hope, encourage people, and make the name of Jesus known. We will meet in Braamfontein on Jorissen Street before going out, so come ready for a meaningful afternoon with great energy, prayer, and conversation. Whether you have done this many times before or you are joining for the first time, you are welcome. If you need a lift, please reach out to the group on WhatsApp so arrangements can be made. Bring a willing heart, invite a friend, and come be part of what God wants to do in the city.",
    url: "./event.html?event=event_aug1",
    lumaUrl: "https://lu.ma/497n5xlz",
    lumaEventId: "497n5xlz",
    time: "10:00 AM",
    image: "img/aug2026.jpeg",
    type: "event"
  },
  "event_aug2": {
    name: "Outreach",
    location: "TBT",
    date: "2026-08-02",
    description: "Join us for our August Community Outreach as we share food, clothing, and the good news with those in need in our area. It’s a meaningful morning of giving, serving, and showing practical care to our less privileged neighbors, and everyone is welcome to be part of it. The location will be shared closer to the day. If you need a lift, please reach out in the WhatsApp group so we can help arrange it. We look forward to spending this special time together and making a real difference.",
    url: "./event.html?event=event_aug2",
    lumaUrl: "https://lu.ma/et5x8g4o",
    lumaEventId: "et5x8g4o",
    time: "12:00 PM",
    image: "img/aug2026.jpeg",
    type: "event"
  }
};
