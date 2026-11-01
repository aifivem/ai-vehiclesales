import { PLACE_PED_SPEC, placePedFields } from "@aicore-fivem/lib/shared";
import type { CardSpec, FileSpec, TabSpec } from "@aicore-fivem/shared";

export const lotsFile: FileSpec = {
  kind: "records",
  sync: "all",
  labelPath: "label",
  newRecord: {
    label: "",
    coords: { x: 0, y: 0, z: 0 },
    radius: 2,
    area: 80,
    sell: { x: 0, y: 0, z: 0 },
    spots: [],
    preview: { x: 0, y: 0, z: 0, heading: 0 },
    camera: { x: 0, y: 0, z: 0, heading: 0 },
    delivery: { x: 0, y: 0, z: 0, heading: 0 },
    blip: true,
  },
  sections: {
    ped: PLACE_PED_SPEC,
    label: { type: "text", min: 1, max: 48 },
    coords: { type: "vec3" },
    radius: { type: "number", min: 1, max: 10 },
    area: { type: "number", min: 20, max: 300 },
    sell: { type: "vec3" },
    spots: {
      type: "list",
      max: 100,
      of: { type: "object", fields: { coords: { type: "vec4" } } },
    },
    preview: { type: "vec4" },
    camera: { type: "vec4" },
    delivery: { type: "vec4" },
    blip: { type: "bool" },
  },
};

const spotsCard: CardSpec = {
  icon: "square-parking",
  title: "ADMIN_C_SPOTS",
  desc: "ADMIN_C_SPOTS_DESC",
  fields: [
    {
      widget: "list",
      path: "spots",
      label: "ADMIN_F_SPOTS",
      addLabel: "ADMIN_ADD_SPOT",
      max: 100,
      newRow: { coords: { x: 0, y: 0, z: 0, heading: 0 } },
      rows: [
        {
          widget: "point",
          path: "coords",
          label: "ADMIN_F_SPOT",
          heading: true,
          ground: true,
        },
      ],
    },
  ],
};

const showroomCard: CardSpec = {
  icon: "camera",
  title: "ADMIN_C_SHOWROOM",
  desc: "ADMIN_C_SHOWROOM_DESC",
  fields: [
    {
      widget: "point",
      path: "preview",
      label: "ADMIN_F_PREVIEW",
      hint: "ADMIN_H_PREVIEW",
      heading: true,
      ground: true,
    },
    {
      widget: "point",
      path: "camera",
      label: "ADMIN_F_CAMERA",
      hint: "ADMIN_H_CAMERA",
      heading: true,
      from: "camera",
    },
    {
      widget: "point",
      path: "delivery",
      label: "ADMIN_F_DELIVERY",
      hint: "ADMIN_H_DELIVERY",
      heading: true,
      ground: true,
    },
  ],
};

export const lotsTab: TabSpec = {
  id: "lots",
  file: "lots",
  icon: "warehouse",
  label: "ADMIN_TAB_LOTS",
  desc: "ADMIN_TAB_LOTS_DESC",
  createLabel: "ADMIN_NEW_LOT",
  deleteLabel: "ADMIN_DELETE_LOT",
  deleteDesc: "ADMIN_DELETE_LOT_DESC",
  cards: [
    {
      icon: "warehouse",
      title: "ADMIN_C_LOT",
      desc: "ADMIN_C_LOT_DESC",
      fields: [
        {
          widget: "text",
          path: "label",
          suggest: { from: "coords" },
          label: "ADMIN_F_LABEL",
          placeholder: "ADMIN_P_LABEL",
        },
        {
          widget: "point",
          path: "coords",
          label: "ADMIN_F_COORDS",
          hint: "ADMIN_H_COORDS",
          ground: true,
        },
        {
          widget: "number",
          path: "radius",
          label: "ADMIN_F_RADIUS",
          min: 1,
          max: 10,
          unit: "m",
        },
        {
          widget: "number",
          path: "area",
          label: "ADMIN_F_AREA",
          hint: "ADMIN_H_AREA",
          min: 20,
          max: 300,
          step: 5,
          unit: "m",
        },
        {
          widget: "point",
          path: "sell",
          label: "ADMIN_F_SELL",
          hint: "ADMIN_H_SELL",
          ground: true,
        },
        { widget: "switch", path: "blip", label: "ADMIN_F_BLIP" },
      ],
    },
    spotsCard,
    showroomCard,
    {
      icon: "user",
      title: "ADMIN_C_PED",
      desc: "ADMIN_C_PED_DESC",
      fields: placePedFields(),
    },
  ],
};
