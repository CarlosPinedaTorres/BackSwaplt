import bcrypt, { hashSync } from "bcryptjs";

export const hashPassword=async(password,rondasCifrado=10)=>{
    return await bcrypt.hash(password,rondasCifrado);
};

export const comparePassword=async(password,hashPassword)=>{
    return await bcrypt.compare(password,hashPassword)
};