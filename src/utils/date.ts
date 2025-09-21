export const getStartOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
};

export const getStartOfWeek = () => {
    const d = new Date();
    const day = d.getDay(); // Sunday = 0
    const diff = d.getDate() - day;
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};
