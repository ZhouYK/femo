const validateInOperator = (key: string, target: any) => {
  let flag;
  try {
    flag = key in target;
  } catch (e) {
    flag = false;
  }
  return flag;
};
export default validateInOperator;
