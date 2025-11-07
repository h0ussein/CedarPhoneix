import ImageKit from 'imagekit';

// ImageKit configuration
// For production, use environment variables instead of hardcoded values
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'public_VKq0vZ/a8UyJzZuUeuYewUQDjxk=',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY ,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/cedarphoenix/'
});

export default imagekit;

