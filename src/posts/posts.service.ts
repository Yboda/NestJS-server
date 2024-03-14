import { Injectable, NotFoundException } from '@nestjs/common';

export interface PostModel {
  id: number;
  author: string;
  title: string;
  content: string;
  likeCount: number;
  commentCount: number;
}

let posts: PostModel[] = [
  {
    id: 1,
    author: 'bora',
    title: '안녕하세요',
    content: '반갑습니당',
    likeCount: 3,
    commentCount: 1,
  },
  {
    id: 2,
    author: 'bora',
    title: '뚜비에용',
    content: '냐냥',
    likeCount: 5,
    commentCount: 2,
  },
  {
    id: 3,
    author: '뚜비',
    title: '뚜비 왕자님',
    content: '귀여웡',
    likeCount: 1,
    commentCount: 10,
  },
];

@Injectable()
export class PostsService {
  getAllPosts = () => {
    return posts;
  };

  getPostById = (id: string) => {
    const post = posts.find((post) => post.id === +id);

    if (!post) {
      throw new NotFoundException();
    }

    return post;
  };

  createPost = (author: string, title: string, content: string) => {
    const post: PostModel = {
      id: posts[posts.length - 1].id + 1,
      author,
      title,
      content,
      likeCount: 0,
      commentCount: 0,
    };

    posts = [...posts, post];

    return post;
  };

  updatePost = (id: string, author: string, title: string, content: string) => {
    const post = posts.find((post) => post.id === +id);
    if (!post) {
      throw new NotFoundException();
    }

    if (author) {
      post.author = author;
    }
    if (title) {
      post.title = title;
    }
    if (content) {
      post.content = content;
    }

    posts = posts.map((prevPost) => (prevPost.id === +id ? post : prevPost));

    return post;
  };

  deletePost = (id: string) => {
    const post = posts.find((post) => post.id === +id);
    if (!post) {
      throw new NotFoundException();
    }

    posts = posts.filter((post) => post.id !== +id);

    return id;
  };
}
