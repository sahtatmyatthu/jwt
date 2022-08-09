const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
app.use(express.json());


const users = [
  {
    id: "1",
    username: "john",
    password: "john0908",
    isAdmin: true,
  },
  {
    id: "2",
    username: "jane",
    password: "jane0908",
    isAdmin: false,
  },
];
// database အစား string ထဲမှာပဲ object တွေနဲ့ စမ်းထားတာမျိုး

let refreshTokens = [];
// refreshToken  တွေကို ထည့်ဖို့အတွက် array တစ်ခုကြေငြာထားတာ

app.post("/api/refresh", (req, res) => {
  const refreshToken = req.body.token;

  if (!refreshToken) return res.status(401).json("You are not authenticated!");

  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json("Refresh token is not valid!");
  }

  jwt.verify(refreshToken, "myRefreshSecretKey", (err, user) => {
    err && console.log(err);

    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

    const newAccessToken = generateAccessToken(user);

    const newRefreshToken = generateRefreshToken(user);

    refreshTokens.push(newRefreshToken);

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });
});
// /api/refresh route က ဘာလုပ်မှာလည်း
// req.body.token ထဲမှာ login route က ပေးတဲ့ refreshToken ပါလာမယ်
// req.body ထဲမှာ token မပါဘူးဆိုရင် 401 error တက်မယ်
// refreshToken တော့ရှိတယ် ဒါပေမဲ့ refreshTokens array ထဲမှာ မရှိတဲ့ ကောင်ဖြစ်မယ်ဆိုရင်တော့ 403  error တက်မယ်

// token ပါလာမယ် refreshTokens array ထဲမှာလည်း အဲ့ကောင် ရှိတယ်ဆိုရင်တော့
// ခုနက token ကို  သူရဲ့ secret key ဖြစ်တဲ့ myRefreshSecretKey နဲ့ verify လုပ်မယ်
// မမှန်ဘူး error path ကိုသွားမယ်ဆိုရင်တော့ အဲ့ဒီ error ကို log ထုတ်ပြမယ်
// token က verify ဖြစ်တယ်ဆိုရင် refreshTokens ထဲကကောင် တွေကို filter လုပ်ပြီး အရင် ကကောင်တေကို ဖျက်မယ် လတ်တလောကောင်ကိုပဲ ချန်ထားမယ်
// refreshTokens array ထဲမှာ လတ်တလော refreshToken ပဲ ကျန်မှာပေါ့

// newAccessToken  ထုတ်မယ်
// refreshToken  ထုတ်မယ်
// refreshTokens array ထဲကို newRefreshToken ကို push လုပ်မယ်
// ဒါဆိုရင် refreshTokens array ထဲမှာ လတ်တလော refreshToken  နဲ့  newRefreshToken ဆိုပြီး နှစ်ခုရှိနေမှာပေါ့

// if everything is ok, create new access token, refresh token and send to user
// res မှာတော့ accessToken  နဲ့ refreshToken ကိုပြန်ပေးမယ်

const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "mySecretKey", {
    expiresIn: "15m",
  });
};
// ပထမဆုံး accessToken ကို ထုတ်ပေးမယ့် function ပါ 15m နေရင် expire ဖြစ်ပါပြီ

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "myRefreshSecretKey");
};
// နောက်ထပ် refreshToken ထုတ်ပေးမယ့် ကောင်ပါ

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find((u) => {
    return u.username === username && u.password === password;
  });
  if (user) {
    const accessToken = generateAccessToken(user);

    const refreshToken = generateRefreshToken(user);
    refreshTokens.push(refreshToken);

    res.json({
      username: user.username,
      isAdmin: user.isAdmin,
      accessToken,
      refreshToken,
    });
  } else {
    res.status(400).json("Username or password incorrect");
  }
});
// /api/login route မှာ ဘာလုပ်မလည်း

// req body ကနေပြီးတော့မှ username နဲ့ password ကိုယူပါမယ်
// users ဆိုတဲ့ list ထဲကနေမှ req body ထဲက ပါတဲ့ username နဲ့ password  ကိုတူတဲ့ကောင် ရှိမရှိ စစ်ပါတယ်

// တူတယ့်ကောင် ရှိတယ်ဆိုရင်
// Generate an access token
// accessToken ကိုထုတ်မယ်

// refreshToken ကို ထုတ်မယ် ပြီးရင် refreshTokens ဆိုတဲ့ list ထဲကို push မယ်
//  ဒီကောင် က refresh route မှာ လတ်တလော token ဆိုတဲ့ကောင် ဖြစ်မယ်

// login လုပ်တဲ့ user ဆီကို username, isAdmin, accessToken နဲ့ refreshToken ကိုပြန်ပို့ပေးမှာပေါ့

// တူတဲ့ကောင်ရှာမတွေ့ဘူးဆိုရင်တော့ username or password မတူဘူးဆိုပြီး 400 errorပြန်ပေးမရမှာပေါ့

const verify = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, "mySecretKey", (err, user) => {
      if (err) {
        return res.status(403).json("Token is not valid");
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json("You are not authenticated!");
  }
};
// ဒီ verify ဆိုတဲ့ functionက toekn က မှန်မမှန် ဆိုတာကို စစ်ပေးမှာ

// postman ရဲ့  req.headers.authorization ထဲမှာ user ဆီကို ပြန်ပို့တဲ့ token ကို ရှေ့မှာ Bearer ဆိုတဲ့ string ကိုပေါင်းပြီး ထည့်ပေးထားတယ်

// ခုနက toekn နဲ့ Bearer ဆိုတဲ့ string ပေါင်းထားတဲ့ကောင်ရှိရင်
// Bearer ကို token ထဲက ပြန်ပြီးခွဲထုတ်လိုက်မယ်

//အပေါ်က token နဲ့ သူ့ကို ပေးထားတဲ့ secret key ကိုပေါင်းပြီးတော့ ပြန်တိုက်စစ်မယ်
// မမှန်ရင် တော့ 403  error ပြန်ပေးမယ်
// token က user ဆိုတာ မှန်သွားပြီဆိုတော့ကား နောက် middleware တစ်ခုမှာဆက်လုပ်ဖို့အတွက် req.user ထဲ့ကို ခု  user ကို ထည့်ပေးလိုက်ပြီ
// req.headers.authorization မှာ ဘာမှ မပါတော့ကား 401 error ပြန်ပေးတာပေါ့

app.delete("/api/users/:userId", verify, (req, res) => {
  if (req.user.id === req.params.userId || req.user.isAdmin) {
    res.status(200).json("User has been deleted.");
  } else {
    res.status(403).json("You are not allowed to delete this user!");
  }
});
//  delete route ကတော့ verify ရဲ့ နောက် middleware အနေနဲ့ သုံးထားပါ
// verify လုပ်ပြီးတော့ ထည့်ပေးလိုက်တဲ့ req.user ရဲ့ id နဲ့ route ထဲ့က id နဲ့ တူမယ် ဒါမှမဟုတ်ရင်လည်း  admin ဆိုရင်တော့ post ကို ဖျက်ခွင့်ရှိမယ် ဆိုတာမျိုးပေါ့
// id လည်းမတူဘူး adminလည်း မဟုတ်တော့ ဖျက်မရဘူးပေါ့


app.post("/api/logout", verify, (req, res) => {
  const refreshToken = req.body.token;
  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
  res.status(200).json("You logged out successfully!");
});
// logout route ကလည်း verify ရဲ့ နောက် middleware အနေနဲ့သုံးတာပါ
// req.body.token ထဲမှာ login route က ပေးတဲ့ refreshToken ပါလာမယ်


app.listen(5000, () => console.log("Backend server is running "));
