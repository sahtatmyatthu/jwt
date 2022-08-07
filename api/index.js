const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
app.use(express.json());

// database အစား string ထဲမှာပဲ object တွေနဲ့ စမ်းထားတာမျိုး
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

// refreshToken  တွေကို ထည့်ဖို့အတွက် array တစ်ခုကြေငြာထားတာ
let refreshTokens = [];

// refrsh လုပ်မယ့် route
app.post("/api/refresh", (req, res) => {
  // take the refresh token form the user
  // user ရဲ့ body ထဲ က token ကို refreshToken ထဲ assign လုပ်မယ်
  const refreshToken = req.body.token;

  // send error if there is no token or it's invalid
  // token မပါဘူးဆိုရင် 401 error တက်မယ်
  if (!refreshToken) return res.status(401).json("You are not authenticated!");
  // refreshToken တော့ရှိတယ် ဒါပေမဲ့ refreshTokens array ထဲမှာ မရှိတဲ့ ကောင်ဖြစ်မယ်ဆိုရင်တော့ 403  error တက်မယ်
  if (!refreshTokens.includes(refreshToken)){
    return res.status(403).json("Refresh token is not valid!")
  }

  // ခုနက token ကို  သူရဲ့ secret key ဖြစ်တဲ့ myRefreshSecretKey နဲ့ verify လုပ်မယ်
  jwt.verify(refreshToken, "myRefreshSecretKey",(err, user)=>{
    // မမှန်ဘူး error path ကိုသွားမယ်ဆိုရင်တော့ အဲ့ဒီ error ကို log ထုတ်ပြမယ်
    err && console.log(err);
    // token က verify ဖြစ်တယ်ဆိုရင် refreshTokens ထဲကကောင် တွေကို filter လုပ်ပြီး အရင် ကကောင်တေကို ဖျက်မယ် လတ်တလောကောင်ကိုပဲ ချန်ထားမယ်
    refreshTokens = refreshTokens.filter((token)=> token !== refreshToken);

    // newAccessToken  ထုတ်မယ်
    const newAccessToken = generateAccessToken(user);
    // refresh  ထုတ်မယ်
    const newRefreshToken = generateRefreshToken(user);
    // refreshTokens array ထဲကို newRefreshToken ကို push လုပ်မယ်
    refreshTokens.push(newRefreshToken);

    // res မှာတော့ accessToken  နဲ့ refreshToken ကိုပြန်ပေးမယ်
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    })
  })



  // if everything is ok, create new access token, refresh token and send to user
});

// ပထမဆုံး accessToken ကို ထုတ်ပေးမယ့် function ပါ 15m နေရင် expire ဖြစ်ပါပြီ
const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "mySecretKey", {
    expiresIn: "15m",
  });
};

// နောက်ထပ် refreshToken ထုတ်ပေးမယ့် ကောင်ပါ
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, isAdmin: user.isAdmin }, "myRefreshSecretKey", 
   
  );
};

// login လုပ်မယ့် route ပါ 
app.post("/api/login", (req, res) => {
  // req body ကနေပြီးတော့မှ username နဲ့ password ကိုယူပါမယ်
  const { username, password } = req.body;
  // users ဆိုတဲ့ list ထဲကနေမှ req body ထဲက ပါတဲ့ username နဲ့ password  ကိုတူတဲ့ကောင် ရှိမရှိ စစ်ပါတယ်
  const user = users.find((u) => {
    return u.username === username && u.password === password;
  });
  // တူတယ့်ကောင် ရှိတယ်ဆိုရင်ဒါတွေကို လုပ်မှာပေါ့
  if (user) {
    // Generate an access token
    // accessToken ကိုထုတ်မယ်
    const accessToken = generateAccessToken(user);
    // refreshToken ကို ထုတ်မယ် ပြီးရင် refreshTokens ဆိုတဲ့ list ထဲကို push မယ်
    const refreshToken = generateRefreshToken(user);
    refreshTokens.push(refreshToken);
    //  ဒါကတော့ login လုပ်တဲ user ဆီကို ပြန်ပြီးပို့ပေးမယ်ကောင်
    res.json({
      username: user.username,
      isAdmin: user.isAdmin,
      accessToken,
      refreshToken,
    });
  } else {// တူတဲ့ကောင်ရှာမတွေ့ဘူးဆိုရင်တော့ username or password မတူဘူးလို့ပြန်ပေးမရမှာပေါ့
    res.status(400).json("Username or password incorrect");
  }
});

// ဒီ verify ဆိုတဲ့ function က user ဆီ ပြန်ပို့ပေးတဲ့  toekn က မှန်မမှန် ဆိုတာကို စစ်ပေးမှာ
const verify = (req, res, next) => {
  // postman ရဲ့  req.headers.authorization ထဲမှာ user ဆီကို ပြန်ပို့တဲ့ token ကို ရှေ့မှာ Bearer ဆိုတဲ့ string ကိုပေါင်းပြီး ထည့်ပေးထားတယ်
  const authHeader = req.headers.authorization;
  // ခုနက toekn နဲ့ Bearer ဆိုတဲ့ string ပေါင်းထားတဲ့ကောင်ရှိရင် လုပ်မယ့်ကောင်တေ
  if (authHeader) {
    // Bearer ကို token ထဲက ပြန်ပြီးခွဲထုတ်လိုက်မယ်
    const token = authHeader.split(" ")[1];

    //အပေါ်က token နဲ့ သူ့ကို ပေးထားတဲ့ secret key ကိုပေါင်းပြီးတော့ ပြန်တိုက်စစ်မယ်
    jwt.verify(token, "mySecretKey", (err, user) => {
      // မမှန်ရင် တော့ 403  error ပြန်ပေးမယ်
      if (err) {
        return res.status(403).json("Token is not valid");
      }
      // token က user ဆိုတာ မှန်သွားပြီဆိုတော့ကား နောက် middleware တစ်ခုမှာဆက်လုပ်ဖို့အတွက် req.user ထဲ့ကို ခု  user ကို ထည့်ပေးလိုက်ပြီ
      req.user = user;
      next();
    });
  } else {
    // req.headers.authorization မှာ ဘာမှ မပါတော့ကား 401 error ပြန်ပေးတာပေါ့
    res.status(401).json("You are not authenticated!");
  }
};


//  delete route ကတော့ verify ရဲ့ နောက် middle ware တစ်ခုပေါ့
app.delete("/api/users/:userId", verify, (req, res) => {
  // verify လုပ်ပြီးတော့ ထည့်ပေးလိုက်တဲ့ req.user ရဲ့ id နဲ့ route ထဲ့က id နဲ့ တူမယ် ဒါမှမဟုတ်ရင်လည်း  admin ဆိုရင်တော့ post ကို ဖျက်ခွင့်ရှိမယ် ဆိုတာမျိုးပေါ့
  if (req.user.id === req.params.userId || req.user.isAdmin) {
    res.status(200).json("User has been deleted.");
  } else {// id လည်းမတူဘူး adminလည်း မဟုတ်တော့ ဖျက်မရဘူးပေါ့
    res.status(403).json("You are not allowed to delete this user!");
  }
});

app.listen(5000, () => console.log("Backend server is running "));
