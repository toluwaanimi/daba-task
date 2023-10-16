import {typing} from "../src/shared/enum";


interface Book {
    __kind: typing.TYPE;
    id: string;
    name: string;
    rating: number;
    authors: Author[];

}

interface Author {
    __kind: typing.TYPE;
    id: string;
    name: string;
    age?: number;
}

interface Filter {
    __kind: typing.INPUT;
    rating?: number;
}

interface Response {
    __kind: typing.TYPE;
    books: Book[];
}