// We need this to create the MD5 hash
const uuid = require('uuid');
const crypto = require('crypto');


// function to encode file data to base64 encoded string
const fs = require('fs');
function base64_encode(file) {
  // read binary data
  var bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return new Buffer(bitmap).toString('base64');
}


const inMemoryAvatars = {};

class InMemoryAvatar {
  static async create ({userId, imageData}) {
    const hash = crypto.createHash('md5').update(imageData.toString()).digest('hex');

    // The full avatar URL
    const avatarUrl = `/avatars/${hash}`;

    let [,contentType,bytesString] = imageData.match(/data:(.*);base64,(.*)$/);
    if(bytesString && contentType) {
      let bytes = Buffer.from(bytesString, 'base64');

      inMemoryAvatars[hash] = {
        dataBytes: bytes,
        contentType,
        userId
      };

      return avatarUrl;
    } else {
      throw "Invalid image"
    }
  }

  static get(imageId) {
    return inMemoryAvatars[imageId];
  }
}

module.exports = InMemoryAvatar;

// Avatars.create({userId: 'caca', imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gOTAK/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU/9sAQwEDBAQFBAUJBQUJFA0LDRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU/8AAEQgAPAA8AwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A/VGiloqAEzUd1dQ2VtLcXEqQQRKXklkYKqKBkkk9AKkrxT45/a/HOq2nhGG7m07w9aob7X79HCDZj91bBj/Exyx/uqFPUjPJisTHC0ZVZdDejS9rNRMLxP8Atx+AfDniR9IW21XUdj7GurS3DR5+hYHH4V1+gftSfDnxBYm4XX47J1IVre7RopAfYEc/hXl114Z8L6Dpoi8Px2sDMv7uNLZisv1lwdxz3LGvkPxb4zTXdU1W0uIFtNY02ZhLaABTsB/1ijuMc8dq+Qw2eYivNpR0/rp/wT6yWTYf2PtFJp+aP0h8OfHfwt4ovxBZ39uYnlaKOX7QhY4ONzJncqk9D7jOK9FznmvxN1/x/rGh/wDEysL5JUBGfJX5gDnHT8iK938Ef8FIPFmh+HLWyu7S31SSIbRc3SP5jKOAGIIBI9cc19HQxdZK9VXXkfP1sNBO1N/efpXa+ItKvcG31G1l9kmUmr6urjKkMD3FfCMur3FqUAlZTnk5PUVLb/ELUtI3G2v54tvzEq7Lz74rihm0vtQ/E6Hlt/hl+B9u6zrNn4f0y41C/lEFpApeSQgnA+gFfNnij4i3vjnWJdM0QxPa3M2XWWAmSSJ2Iy2eRjAGT6DFeb3Hxf8AEviu2j8NalLcaxpuquLaazVj5siE87ZF+dT6Eexr0nwZoOheFPGVrqd7puo6Ve6fZvYWv268kuVMLsGwZWLF8HgZY4HA6DHhZxjXiYqC0j+p7eW4alhIyqzjzzV7Lp0tpve/3HoureAotVsUjkurwxRKPLtY3SKCMDoAqKDge5NfBv7WugWNv4sTU9NVrTWIU8ozjguR0JPc9fzNffF348tIreRJGEL7iu1j+FfJP7R3hVNduJpVj2b1JWQevbpXgYaqqdeM7+p2ZfTrVKVSnWWm69T8/NI8UT+G9amlaIXUEkoEkBYqhBPoPoehrsrx7KS7m+0XkMkisV3QxB12j7uDjnjFcf4l8NNputahpTbljNwhaTdx3wfpyfzr03wfoun2Hhyzkl162sTdBp1txK4ZBuK/MApwfkP4Yr76rVhGKmup41DCVKjknol3/pH2ZqDIcnaCD1I/z7GuZ1uNQgVON+MZHUnpVrVtUSCR1eQ4HUg+vWucl1J728SM5dQc/LkkY7187FNnp04nUfDzw5qGs+IVutPkijl0+QMHuiQiqMeYGI6ZVuDzzg10/g34qt4m+KugeGdHtReeGreFoLnUpEKxXSxKwcwxg8/PktI245ONx4A84uvjL4W+FvgyZNW8+81C9ldpLSzjWQ7NxA3FmC4244zn2r2Pwpd+CPhj4X07xtbwzT3msaZCIxO0ax2EBQMIY0QBVUHHAz061z4rmpxu476I9GjUhGnUi4tyei7LTe/l/Wpl/FbVpdM+IUcfnsLFNq+Wr4znHJ+uK474peNYp9DYyTB/LUtIu0EgDpjHXn/PTHzp8UP2jm8Q/Eqa4hIisxLuck/u1H4YzXH/ABO+NvmaX5dlIrSTxlSUPCjGPU5OMUqWW1G4cyKWNpwpcqesVY4m78c2d38RBrtzaG70+znErWglMXnbOgLAEj64qPxn8crnxnrJvp9O0uzWOMQxQwWasqoCSBljk/ePJrgtOEt8shSNtjAgtjuapaXeeGre02arBeSXYZgTCUAxnjqOtfZxw9O92rtaHzFXFVqcEoyspan6oTeBzDoV9ql+jXEio32a2R8KXXks567R7V8rfF3x/qr61GE1CK30+IKsC2kYiG5RyVAzjkkevFfZnxKu30X4c+MtQgVXnstPKQrIMqu8qhOBjoHJHbOOo4r8uviT4r1DTxbXCOsk8iyFXlXcIv3jfcU8D8jXBhaN2j6HEOlQoylBfy/ir/lv5nWeJfGWoalaRrqTRSxCRmVzhXO773HfPXjvmofEPxb8Z3PhN4tM1SPVNFtHNu9iiFTbKSSgA6hSoA75wenfzm7eX+wNF1KWeW4vtSjkeaaZtxGGK4X0GB9fetf4bWyz3+tWDFgklilwsisQ8cqXEW117Zw7ryDw7etetKhBR99XseWsVLEtRSsnp53fW9vvvc9m/ZB+DvhH9o3W/wCydf8AEF7p2sITKdKt0RFuIx3jkJJJHddoIHIJGcdl8X/h/wCBfhT4gNpcaWsmmWEhBtvmmmlwcYwTljn8K5CDwtpvgnV/BviXQoX0vVb396ZLWV0WF9itujAPyn5j7c9K84+NfjvVl1q804SrtmbMtwcmZzk5O4njPfGK4ZZfUqYhylVah2QRxCoULqCbemvl+d/kdT4+8f8AhnxjDbSeG5EtrCEbfsroIWTHquffH4cV4svwrllkma78U+H9Om8xswXFy0jjvyY0ZfwzXo7eGoPCvwv0HX9LuJrbUrq+khll2xsSAgYEEoSD9DXM6t4v137SudXuidgJIYDJyeeBXfhMOqa5ab08/wDhjHG4iE1z146x0sr2u/8At5Pof//Z"}).catch(console.log).then(console.log)
