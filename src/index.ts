import Application from "./core/application";

const appName = process.env.APP_NAME || "dexbooru-notifications";
const serverPort = process.env.PORT || "3000";

const app = new Application(appName);
app.listen(serverPort);
