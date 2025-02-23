"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./create.module.scss";
const NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT =
  process.env.NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT;
import { useLoading } from "../../../context/LoadingContext";
import Link from "next/link";
import { useRouter } from "next/navigation";


export default function CreateGroupsComponent() {
  const router = useRouter();
  const [banner, setBanner] = useState([]);
  const [token, setToken] = useState(null);
  const { setLoading } = useLoading();
  const [selectedBannerId, setSelectedBannerId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo_url: "",
    banner: 0,
    admin_id: 0,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios
        .get(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/options/v1/retrieveBanner`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then((response) => {
          console.log(response);
          setBanner(response.data);
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
        });
    }
  }, [token]);

  const handleBannerChange = (e) => {
    setSelectedBannerId(e.target.value); // Update the selected banner ID
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    setLoading(true);
    const localToken = localStorage.getItem("token");
    const localUserId = localStorage.getItem("userId");

    try {
      let uploadedImageUrl;

      if (formData.logo_url !== undefined && formData.logo_url !== "") {
        uploadedImageUrl = formData.logo_url;
      }

      // If profile picture is a file, upload it
      if (uploadedImageUrl && uploadedImageUrl.startsWith("data:image")) {
        const formData = new FormData();
        const mimeType = uploadedImageUrl.split(";")[0].split(":")[1];

        const blob = await fetch(uploadedImageUrl).then((res) => res.blob());
        const file = new File([blob], "profile-picture.jpg", {
          type: mimeType,
        });

        formData.append("file", blob);
        formData.append("name", "profile-picture.jpg");

        const uploadResponse = await axios.post(
          `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/wp/v2/media`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${localToken}`,
            },
          }
        );

        uploadedImageUrl = uploadResponse.data.source_url;
      }

      const requestData = { ...formData };
      if (uploadedImageUrl) {
        requestData.logo_url = uploadedImageUrl;
      }

      // Save profile data
      const createdGroup = await axios.post(
        `${NEXT_PUBLIC_WORDPRESS_REST_GLOBAL_ENDPOINT}/profile/v1/createUserGroups`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${localToken}`,
          },
        }
      );
      const redirectionSlug = createdGroup.data.slug;
      router.push(`/groups/${redirectionSlug}`);

      setLoading(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      setLoading(false);
      alert("Il y a eu une erreur pendant la sauvegarde du groupe...");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          logo_url: reader.result, // Base64 encoded image
        }));
      };

      reader.readAsDataURL(file); // Convert the file to a Base64 string
    }
  };

  return (
    <div className={styles.create}>
      <div className={styles.heading}>
        <h1>Mes groupes</h1>
      </div>
      <div className={styles.groupsInner}>
        <h3>Créer un groupe</h3>
        <hr />
        <div className={styles.nameGroup}>
          <label htmlFor="name">Nom :</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
        </div>
        <div className={styles.nameGroup}>
          <label htmlFor="description">Description : </label>
          <textarea
            type="textarea"
            name="description"
            value={formData.description}
            rows="5"
            onChange={handleInputChange}
          />
        </div>

        <div className={styles.editImage}>
          <label htmlFor="picture">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M-0.00488281 13.2069V15.4998C-0.00488281 15.6325 0.0477957 15.7596 0.141564 15.8534C0.235332 15.9472 0.362509 15.9998 0.495117 15.9998H2.79312C2.92547 15.9998 3.05241 15.9473 3.14612 15.8538L12.5941 6.40585L9.59412 3.40585L0.142118 12.8538C0.0482818 12.9474 -0.00458943 13.0744 -0.00488281 13.2069ZM10.8321 2.16685L13.8321 5.16685L15.2921 3.70685C15.4796 3.51932 15.5849 3.26501 15.5849 2.99985C15.5849 2.73468 15.4796 2.48038 15.2921 2.29285L13.7071 0.706849C13.5196 0.519378 13.2653 0.414062 13.0001 0.414062C12.735 0.414062 12.4806 0.519378 12.2931 0.706849L10.8321 2.16685Z"
                fill="black"
              />
            </svg>
          </label>
          <input
            id="picture"
            name="picture"
            className={styles.inputFile}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e)}
          />
          {formData.logo_url && <div></div>}
        </div>
        <div className={styles.bannerImage}>
          <p>Bannière du groupe : </p>
          {banner?.map((item) => (
            <div className={styles.bannerInner} key={item.id}>
              <label
                htmlFor={`banner_${item.id}`}
                className={selectedBannerId == item.id ? styles.active : ""}
              >
                <img src={item.url} alt="" />
                <input
                  type="radio"
                  name="banner"
                  id={`banner_${item.id}`}
                  value={item.id}
                  checked={selectedBannerId === item.id} // Ensures the correct radio button is checked
                  onChange={handleBannerChange}
                />
              </label>
            </div>
          ))}
        </div>
      </div>
      <button className={styles.btnFill} onClick={handleSave}>
        Sauvegarder
      </button>
    </div>
  );
}
