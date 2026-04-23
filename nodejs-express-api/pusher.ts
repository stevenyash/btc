import Pusher from "pusher";

const pusher = new Pusher({
  appId: "1930589",
  key: "feb7ca74f8b5239b439f",
  secret: "a3f78366f1e5680ad1ff",
  cluster: "ap2",
  useTLS: true,
});

export default pusher;