"use client";

import React, { useState, useEffect } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";
import { fetchOrgCount, fetchProductCount, fetchUserCount } from "@/lib/utils";

export default function AdminBannerCards() {
  const [userCount, setUserCount] = useState(0);
  const [orgCount, setOrgCount] = useState(0);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const [users, orgs, products] = await Promise.all([
        fetchUserCount(),
        fetchOrgCount(),
        fetchProductCount(),
      ]);
      setUserCount(users);
      setOrgCount(orgs);
      setProductCount(products);
    };
    loadData();
  }, []);

  const data = [
    {
      title: "Users",
      value: userCount,
      chartData: [
        {
          month: "January",
          value: 309,
        },
        {
          month: "February",
          value: 269,
        },
        {
          month: "March",
          value: 286,
        },
        {
          month: "April",
          value: 312,
        },
        {
          month: "May",
          value: 187,
        },
        {
          month: "June",
          value: 249,
        },
        {
          month: "July",
          value: 275,
        },
        {
          month: "August",
          value: 293,
        },
        {
          month: "September",
          value: 305,
        },
        {
          month: "October",
          value: 289,
        },
        {
          month: "November",
          value: 326,
        },
        {
          month: "December",
          value: 341,
        },
      ],
      change: "33%",
      changeType: "positive",
      xaxis: "month",
    },
    {
      title: "Organizations",
      value: orgCount,
      chartData: [
        {
          month: "January",
          value: 40,
        },
        {
          month: "February",
          value: 1256,
        },
        {
          month: "March",
          value: 1123,
        },
        {
          month: "April",
          value: 1300,
        },
        {
          month: "May",
          value: 943,
        },
        {
          month: "June",
          value: 943,
        },
        {
          month: "July",
          value: 1089,
        },
        {
          month: "August",
          value: 1245,
        },
        {
          month: "September",
          value: 1190,
        },
        {
          month: "October",
          value: 1350,
        },
        {
          month: "November",
          value: 1159,
        },
        {
          month: "December",
          value: 1275,
        },
      ],
      change: "0%",
      changeType: "neutral",
      xaxis: "month",
    },
    {
      title: "Products",
      value: productCount,
      chartData: [
        {
          month: "January",
          value: 40,
        },
        {
          month: "February",
          value: 8000,
        },
        {
          month: "March",
          value: 7000,
        },
        {
          month: "April",
          value: 15000,
        },
        {
          month: "May",
          value: 20000,
        },
        {
          month: "June",
          value: 18000,
        },
        {
          month: "July",
          value: 25000,
        },
        {
          month: "August",
          value: 50000,
        },
        {
          month: "September",
          value: 35000,
        },
        {
          month: "October",
          value: 28441,
        },
        {
          month: "November",
          value: 32000,
        },
        {
          month: "December",
          value: 30500,
        },
      ],
      change: "19%",
      changeType: "negative",
      xaxis: "month",
    },
  ];

  return (
    <dl className="divide-default-200 rounded-medium bg-content1 shadow-small dark:border-default-100 grid w-full grid-cols-1 gap-5 divide-y border border-transparent p-2 sm:grid-cols-2 sm:divide-y-0 md:grid-cols-3 md:divide-x">
      {data.map(({ title, value, change, changeType, chartData }, index) => (
        <div key={index} className="max-h-[140px]">
          <section className={"flex flex-wrap justify-between"}>
            <div className="flex flex-col justify-between gap-y-2 p-4">
              <div>
                <div className="text-default-600 text-sm font-medium">
                  {title}
                </div>
                <div className="mt-4">
                  <span className="text-default-700 text-3xl font-semibold">
                    {value}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-x-1 text-xs">
                <Icon
                  className={cn(
                    changeType === "positive"
                      ? "text-success-500"
                      : changeType === "negative"
                        ? "text-danger-500"
                        : "text-default-500",
                  )}
                  icon={
                    changeType === "positive"
                      ? "heroicons:arrow-trending-up-solid"
                      : changeType === "negative"
                        ? "heroicons:arrow-trending-down-solid"
                        : "heroicons:minus"
                  }
                  width={20}
                />
                <div className="text-default-500">{change}</div>
              </div>
            </div>
            <div className="min-w-[80px] overflow-hidden">
              <ResponsiveContainer height={140} width="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <YAxis
                    axisLine={false}
                    domain={[0, "dataMax"]}
                    hide
                    tick={false}
                  />
                  <Area
                    animationBegin={800}
                    animationDuration={2000}
                    dataKey="value"
                    fill={
                      changeType === "positive"
                        ? "#0A954F"
                        : changeType === "negative"
                          ? "#F6423A"
                          : "#888888"
                    }
                    fillOpacity={0.8}
                    name="Revenue"
                    stroke={
                      changeType === "positive"
                        ? "#08793E"
                        : changeType === "negative"
                          ? "#F6423A"
                          : "#888888"
                    }
                    strokeWidth={3}
                    type="monotone"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      ))}
    </dl>
  );
}
