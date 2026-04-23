export function sanitizeInput(obj: any): any {
  if (!obj) {
    return;
  }

  Object.keys(obj).forEach(key => {
    if (Array.isArray(obj[key])) {
      obj[key].map((o: any) => {
        if (typeof o === 'object') {
          sanitizeInput(o);
        }
      });
    } else if (typeof obj[key] === 'string') {
      obj[key] = obj[key].trim();
      if (obj[key] === '') {
        obj[key] = null;
      }
    } else if (typeof obj[key] === 'object') {
      sanitizeInput(obj[key]);
    }
  });

  return obj;
}

export default sanitizeInput;