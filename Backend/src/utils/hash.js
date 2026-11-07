import bcrypt from 'bcryptjs';

const saltRounds = 10;

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};