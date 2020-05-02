import femo from "../src";
import users from "./model/users";
import profile from "./model/profile";

const store = femo({
  users,
  profile,
});
export default store;
