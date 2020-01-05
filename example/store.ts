import femo from "../src";
import users from "./model/users";

const store = femo({
    users,
});
export default store;
