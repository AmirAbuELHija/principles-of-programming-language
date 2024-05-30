// PPL 2023 HW4 Part2

import { expect } from "@jest/globals";

// Q 2.1 

// Specify the return type.
export const delayedSum =(a: number, b: number, delay: number): Promise<number> => {
  return new Promise<number>((resolve) => {
    setTimeout(() => {
      resolve(a + b);
    }, delay);
  });
};
export const testDelayedSum =async (a1: number, a2: number, delay: number): Promise<string> => {
  const startTime = Date.now();
  try {
    const sum = await delayedSum(a1, a2, delay);
    const endTime = Date.now();
    const dela = endTime - startTime;
    console.log(`Sum: ${sum}, Delay: ${dela}ms`);
    return  (dela < delay) ? 'failure' :'passed'
  } catch (error) {
      throw new Error();
  }
};

// Q 2.2
// Values returned by API calls.
export type Post = {
userId: number;
id: number;
title: string;
body: string;
}
// When invoking fetchData(postsUrl) you obtain an Array Post[]
// To obtain an array of posts
export const postsUrl = 'https://jsonplaceholder.typicode.com/posts'; 

// Append the desired post id.
export const postUrl = 'https://jsonplaceholder.typicode.com/posts/'; 

// When invoking fetchData(invalidUrl) you obtain an error
export const invalidUrl = 'https://jsonplaceholder.typicode.com/invalid';

// Depending on the url - fetchData can return either an array of Post[] or a single Post.
// Specify the return type without using any.
export const fetchData = async (url: string): Promise<Post[] | Post> => {
const x = await fetch(url);
const error_message = "Error fetching data";
if (x.ok) {
  return  x.json();
}

throw new Error(error_message);
};

export const testFetchData = async (post: string): Promise<string> => {
try {
  expect(Array.isArray((await fetchData(postsUrl)))).toEqual(true);
  const slected_post = await fetchData(post);
  expect(slected_post).toHaveProperty('body');
  expect(slected_post).toHaveProperty('title');
  expect(slected_post).toHaveProperty('id');
  expect(slected_post).toHaveProperty('userId');
  return 'passed';
} catch (error) {
  throw new Error();
}
};
 

// Q 2.3

// Specify the return type.
export const fetchMultipleUrls = async (urls: string[]): Promise<any[]> => {

    const Fetched_urls = urls.map((urls) => fetch(urls));
    await Promise.all(Fetched_urls.map(async (param) => {
        if (!(await param).ok) {
            throw new Error();
        }
    }))
    const res = await Promise.all(Fetched_urls);
    const jasonn_array =  await Promise.all(res.map((response) => response.json()));
    return jasonn_array;
}



export const testFetchMultipleUrls=async( ): Promise<string>=> {
    try {
        const apiUrl1 = 'https://jsonplaceholder.typicode.com/posts/1';
        const urls = Array.from({ length: 20 }, (_, index) => postUrl + (index + 1));
        const arr = await fetchMultipleUrls(urls);
        const idd=arr[arr.length - 1].id
        expect(arr.length).toEqual(20);
        expect(idd).toEqual(apiUrl1); 
        return 'pass';
    } catch (e) {
    return "fail"  }
}