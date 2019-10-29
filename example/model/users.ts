import { gluer } from "../../src";
import { Users } from "../interface";

const initialUsers: Users = {
    list: [],
    total: 0
};

const users = gluer(initialUsers);

export default users;
