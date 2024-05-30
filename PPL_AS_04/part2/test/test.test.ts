import { describe, expect, test } from '@jest/globals'
import {
    delayedSum, Post, postsUrl, postUrl, invalidUrl, fetchData, fetchMultipleUrls, testDelayedSum, testFetchData
} from '../src/part2';

describe('Assignment 4 Part 2', () => {
    describe('Q2.1 delayedSum (6 points)', () => {
        test('delayedSum returns the sum', async () => {
            await delayedSum(20,5,10).then((ok)=> expect(ok).toEqual(25)).catch((ok) => {throw ok});
            await delayedSum(100,100,50).then((ok)=> expect(ok).toEqual(200)).catch((ok) => {throw ok});
            await delayedSum(0,30,100).then((ok)=> expect(ok).toEqual(30)).catch((ok) => {throw ok});
            await delayedSum(1,1,200).then((ok)=> expect(ok).toEqual(2)).catch((ok) => {throw ok});
            await delayedSum(2,8,400).then((ok)=> expect(ok).toEqual(10)).catch((ok) => {throw ok});
            await delayedSum(10,10,700).then((ok)=> expect(ok).toEqual(20)).catch((ok) => {throw ok});
            await delayedSum(123,47,900).then((ok)=> expect(ok).toEqual(170)).catch((ok) => {throw ok});
            await delayedSum(746,4,500).then((ok)=> expect(ok).toEqual(750)).catch((ok) => {throw ok});
            await delayedSum(32849,1,600).then((ok)=> expect(ok).toEqual(32850)).catch((ok) => {throw ok});
            await delayedSum(0.5,0.2,300).then((ok)=> expect(ok).toEqual(0.7)).catch((ok) => {throw ok});
            await delayedSum(-20,6,150).then((ok)=> expect(ok).toEqual(-14)).catch((ok) => {throw ok});
        })
        test('delayedSum waits at least the specified delay', async () => {
            await testDelayedSum(5, 5, 500).then((ok) => {expect(ok).toEqual("passed");})
            await testDelayedSum(100,100,50).then((ok) => {expect(ok).toEqual("passed");});
            await testDelayedSum(0,30,100).then((ok) => {expect(ok).toEqual("passed");});
            await testDelayedSum(1,1,200).then((ok) => {expect(ok).toEqual("passed");});
            await testDelayedSum(2,8,400).then((ok) => {expect(ok).toEqual("passed");});
            await testDelayedSum(10,10,700).then((ok) => {expect(ok).toEqual("passed");});
            await testDelayedSum(123,47,900).then((ok) => {expect(ok).toEqual("passed");});
            await testDelayedSum(746,4,500).then((ok) => {expect(ok).toEqual("passed");});
    })
   
    describe('Q2.2 fetchData (12 points)', () => {
        const postUrl = 'https://jsonplaceholder.typicode.com/posts/';
        const postsUrl = 'https://jsonplaceholder.typicode.com/posts'; 
        const invalidUrl = 'https://jsonplaceholder.typicode.com/invalid';
        test('successful call to fetchData with array result', async () => {
            const postsArray = (await fetchData(postsUrl));
            expect(Array.isArray(postsArray)).toEqual(true);

            expect(testFetchData(postUrl+45)).resolves.toEqual("passed")    
            expect(testFetchData(postUrl+12)).resolves.toEqual("passed") 
            expect(testFetchData(postUrl+64)).resolves.toEqual("passed") 
        
        })
                

        test('successful call to fetchData with Post result', async () => {
            expect(testFetchData(postUrl+1)).resolves.toEqual("passed")    
            expect(testFetchData(postUrl+44)).resolves.toEqual("passed") 
            expect(testFetchData(postUrl+66)).resolves.toEqual("passed") 
           
        })

        test('failed call to fechData', async () => {
            expect(testFetchData(invalidUrl)).rejects.toThrow(Error)
            expect(testFetchData(postUrl+101)).rejects.toThrow(Error)
            expect(testFetchData(postUrl+103)).rejects.toThrow(Error)
            expect(testFetchData(postUrl+(-200))).rejects.toThrow(Error)
        })

    })

    describe('Q2.3 fetchMultipleUrls (12 points)', () => {
        test('successful call to fetchMultipleUrls', async () => {
            const test1 = [postUrl+11, postUrl+2]
            expect(Array.isArray( await fetchMultipleUrls(test1))).toEqual(true);           
            try {
                const res = await fetchMultipleUrls(test1);
                expect(Array.isArray(res)).toEqual(true);
            } catch (error) {}
            const test2 = [postUrl+1, postUrl+90]
            expect(Array.isArray( await fetchMultipleUrls(test2))).toEqual(true);           
            try {
                const res = await fetchMultipleUrls(test2);
                expect(Array.isArray(res)).toEqual(true);
            } catch (error) {}
            const test3 = [postUrl+44, postUrl+66]
            expect(Array.isArray( await fetchMultipleUrls(test3))).toEqual(true);           
            try {
                const res = await fetchMultipleUrls(test3);
                expect(Array.isArray(res)).toEqual(true);
            } catch (error) {}
        })

        test('successful call to fetchMultipleUrls: verify results are in the expected order ', async () => {
            const test4 = [postUrl+7, postUrl+25, postUrl+90, postUrl+44, postUrl+66, postUrl+18]
            const res = await fetchMultipleUrls(test4);
            expect(res[0].id).toEqual(7);
            expect(res[1].id).toEqual(25);
            expect(res[2].id).toEqual(90);
            expect(res[3].id).toEqual(44);
            expect(res[4].id).toEqual(66);
            expect(res[5].id).toEqual(18);
        })

        test('failed call to fetchMultipleUrls', async () => {
            const test5 = fetchMultipleUrls([invalidUrl])
            await expect(test5).rejects.toThrow(Error)
        })
    })
});
})

