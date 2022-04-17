const PassportInitializer = require("../utils/passport-initializer");

const Passport = require("passport");
const ExpressSession = require("express-session");
const Express = require("express");
const Path = require("path");
const Fs = require("fs");

PassportInitializer(Passport);

class WebServer {
    constructor() {
        this.app = Express();

        this.app.set("trust proxy", true);
        this.app.set("view engine", "ejs");
        this.app.set("views", Path.join(__dirname, "views"));

        this.app.use(Express.json());
        this.app.use(Express.urlencoded({ extended: false }));
        this.app.use(ExpressSession({ saveUninitialized: false, secret: "YupS8hVh75q4GYiz5Kq9MPNDf3LXUM", resave: false }));
        this.app.use(Express.static(Path.join(__dirname, "public")));
        this.app.use(Passport.initialize());
        this.app.use(Passport.session());
    };

    registerRouters(directoryPath, currentURL) {
        if (!directoryPath?.length) directoryPath = Path.join(__dirname, "routers");
        if (!currentURL?.length) currentURL = ("/");

        if (Fs.existsSync(directoryPath)) {
            Fs.readdirSync(directoryPath)
            .forEach((directoryFile) => {
                let filePath = Path.join(directoryPath, directoryFile);
                let fileStat = Fs.lstatSync(filePath);
                
                if (fileStat.isDirectory()) this.registerRouters(filePath, (currentURL + directoryFile + "/"));
                else {
                    try {
                        let router = require(filePath);

                        this.app.use(currentURL, router);
                    } catch (error) {
                        console.log(("ROUTERS"), (`${currentURL}${directoryFile}`), error.message ? error.message : error);
                    };
                };
            });
        } else console.log(("HANDLER"), ("ROUTERS"), (`<${directoryPath}> does not exist`));
    };
};

module.exports = WebServer;