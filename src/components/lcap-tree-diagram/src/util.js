export const addCurIndex = function (finalResult) {
    const arrayTreeAddIndex = (array, levelName = 'curIndex', childrenName = 'children') => {
        if (!Array.isArray(array))
            return [];
        const recursive = (array, level = 0) => {
            level++;
            return array.map((v, index) => {
                v[levelName] = level;
                console.log(index, '--index');
                const child = v[childrenName];
                if (child && child.length)
                    recursive(child, level);
                return v;
            });
        };
        return recursive(array);
    };
    arrayTreeAddIndex(finalResult);
    return finalResult;
};