import Application from "./core/application";

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const appName = process.env.APP_NAME || "dexbooru-notifications";
const serverPort = process.env.PORT || "3000";

const app = new Application(appName);
app.listen(serverPort);
