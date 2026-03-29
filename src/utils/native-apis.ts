import { IStartPay } from "../types/nativeAPIs";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const ShowLoading = () => {
  window.ma.showLoading({
    title: "KBZPay",
  });
};
export const HideLoading = () => {
  window.ma.hideLoading();
};

export const CloseMiniProgram = () => {
  window.ma.miniProgram.close();
};

export const GetAuthCode = (
  success?: (code: string) => void,
  fail?: (error: unknown) => void,
) => {
  window.ma.getAuthCode({
    scopes: ["AUTH_BASE", "USER_NICKNAME", "PLAINTEXT_MOBILE_PHONE"],
    success: (res: any) => {
      console.log("Auth Code:", res.authCode);
      success?.(res.authCode);
    },
    fail: (err: unknown) => {
      console.error("Failed to get auth code:", err);
      fail?.(err);
    },
  });
};

export const ShowToast = ({
  title,
  icon,
  duration,
}: {
  title: string;
  icon: "success" | "error" | "loading" | "none";
  duration?: number;
}) => {
  window.ma.showToast({
    title,
    icon,
    duration: duration || 2000,
  });
};

// function chooseImage() {
//    window.ma.callNativeAPI('chooseImage', {
//       selectType: "1"  //  "0" Use the camera or select images from the album;  "1" Use the camera;  "2" select images from the album.
//     }, result => {
//      console.log(result.tempFilePath); // tempFilePath can be used as the src attribute value of the image element
//     });
//   }

export const ChooseImage = (success?: (result: { base64: string }) => void) => {
  window.ma.callNativeAPI(
    "chooseImage",
    {
      selectType: "2", // "0" Use the camera or select images from the album;  "1" Use the camera;  "2" select images from the album.
    },
    (result: { base64: string }) => {
      console.log(
        "Image selected (base64):",
        result.base64?.substring(0, 50) + "...",
      );
      success?.(result);
    },
  );
};

// Helper function to convert file path to base64
export const ConvertFilePathToBase64 = async (
  filePath: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create an image element to load the file
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      try {
        // Create canvas to convert image to base64
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0);

        // Convert to base64
        const base64 = canvas.toDataURL("image/jpeg", 0.9);
        // Remove the data:image/jpeg;base64, prefix
        resolve(base64.split(",")[1]);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = (error) => {
      reject(error);
    };

    // Load the image from file path
    img.src = filePath;
  });
};

// Helper function to compress image from file path
export const CompressImageFromPath = async (
  filePath: string,
  maxWidth: number,
  maxHeight: number,
  quality: number,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Get base64 with quality compression
        const base64 = canvas.toDataURL("image/jpeg", quality);
        // Remove the data:image/jpeg;base64, prefix
        resolve(base64.split(",")[1]);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = (error) => {
      reject(error);
    };

    // Load the image from file path
    img.src = filePath;
  });
};

export const StartPay = (payload: IStartPay, cb?: () => void) => {
  window.ma?.callNativeAPI("startPay", payload, (res: any) => {
    console.log("payment response:", res);
    if (res.resultCode == 1) {
      console.log("start pay success");
      cb?.();
    }
  });
};
